#!/usr/bin/env node
// kubik's own checks. Run from anywhere:  node tests/run.mjs [--no-browser]
//
// Static checks need only Node 22+. The browser checks also need a local Chrome or Chromium
// (pass --no-browser to skip them, or set CHROME_PATH). Nothing is installed from npm.
// Exit code: 0 when every check passes, 1 otherwise.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = join(ROOT, 'skills', 'kubik');
const SCRIPTS = join(SKILL, 'scripts');
const FIX = join(ROOT, 'tests', 'fixtures');
const noBrowser = process.argv.includes('--no-browser');

let failed = 0, passed = 0, skipped = 0;
const check = (name, ok, detail = '') => {
  if (ok) { passed++; console.log(`PASS  ${name}`); }
  else { failed++; console.log(`FAIL  ${name}${detail ? '\n      ' + String(detail).split('\n').join('\n      ') : ''}`); }
};
const skip = (name, why) => { skipped++; console.log(`SKIP  ${name} (${why})`); };
const read = (p) => readFileSync(p, 'utf8');
const json = (p) => JSON.parse(read(p));
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', timeout: 240000, ...opts });
const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

console.log('## manifests');
const manifests = {
  claudePlugin: join(ROOT, '.claude-plugin', 'plugin.json'),
  claudeMarket: join(ROOT, '.claude-plugin', 'marketplace.json'),
  codexPlugin: join(ROOT, '.codex-plugin', 'plugin.json'),
  codexMarket: join(ROOT, '.agents', 'plugins', 'marketplace.json'),
};
const m = {};
for (const [k, p] of Object.entries(manifests)) {
  try { m[k] = json(p); check(`${relative(ROOT, p)} is valid JSON`, true); }
  catch (e) { check(`${relative(ROOT, p)} is valid JSON`, false, e.message); }
}
if (Object.keys(m).length === 4) {
  const versions = [m.claudePlugin.version, m.claudeMarket.plugins?.[0]?.version, m.codexPlugin.version, m.codexMarket.plugins?.[0]?.version];
  check(`one version in all four manifests (${versions.join(', ')})`, new Set(versions).size === 1 && /^\d+\.\d+\.\d+$/.test(versions[0] ?? ''));
  const names = [m.claudePlugin.name, m.claudeMarket.name, m.claudeMarket.plugins?.[0]?.name, m.codexPlugin.name, m.codexMarket.name, m.codexMarket.plugins?.[0]?.name];
  check('every manifest names the plugin kubik', names.every((n) => n === 'kubik'), names.join(', '));
  check('both plugin manifests declare the licence of LICENSE', m.claudePlugin.license === m.codexPlugin.license && read(join(ROOT, 'LICENSE')).includes('Apache License') === (m.claudePlugin.license === 'Apache-2.0'));
  const codexSkills = resolve(ROOT, m.codexPlugin.skills ?? ''), codexHooks = resolve(ROOT, m.codexPlugin.hooks ?? '');
  check('the Codex manifest points at the skills directory and its hooks file', existsSync(join(codexSkills, 'kubik', 'SKILL.md')) && existsSync(codexHooks));
}
check('NOTICE names the author and the repository', /Konstantin Stasenko/.test(read(join(ROOT, 'NOTICE'))) && /github\.com\/stakost\/kubik/.test(read(join(ROOT, 'NOTICE'))));

console.log('\n## the skill');
const skillText = read(join(SKILL, 'SKILL.md'));
const fm = /^---\n([\s\S]*?)\n---\n/.exec(skillText);
const fields = fm ? fm[1].split('\n').filter((l) => /^[a-z-]+:/.test(l)).map((l) => l.split(':')[0]) : [];
check('frontmatter has exactly name and description', fm && fields.length === 2 && fields.includes('name') && fields.includes('description'), fields.join(', '));
const desc = fm ? (/^description:\s*(.*)$/m.exec(fm[1])?.[1] ?? '') : '';
check(`description is a trigger ("Use when…"), ${desc.length} characters`, desc.startsWith('Use when') && desc.length <= 1024);
const mdFiles = walk(SKILL).filter((p) => p.endsWith('.md'));
check('only SKILL.md carries frontmatter', mdFiles.filter((p) => read(p).startsWith('---\n')).length === 1);
// the second skill: a router to words.md, with the same frontmatter rules
const wordsSkill = read(join(ROOT, 'skills', 'kubik-words', 'SKILL.md'));
const wfm = /^---\n([\s\S]*?)\n---\n/.exec(wordsSkill);
const wfields = wfm ? wfm[1].split('\n').filter((l) => /^[a-z-]+:/.test(l)).map((l) => l.split(':')[0]) : [];
check('kubik-words frontmatter has exactly name and description, and the description is a trigger', wfm && wfields.length === 2 && /^description:\s*Use when/m.test(wfm[1]));
check('kubik-words points at words.md and the file exists', /\.\.\/kubik\/words\.md/.test(wordsSkill) && existsSync(join(SKILL, 'words.md')));
check('the entry skill requires words.md', /`words\.md`/.test(skillText));
const unresolved = [];
for (const f of mdFiles) {
  for (const [, ref] of read(f).matchAll(/`([\w/.-]+\.(?:md|mjs|sh|js))`/g)) {
    if (ref === 'DESIGN.md') continue;                       // the file a project holds, not one of ours
    const bare = ['roll.mjs', 'page-audit.mjs', 'deck-shots.mjs', 'lint.mjs', 'deck-runtime.js', 'page-runtime.js', 'browser.mjs'].includes(ref) ? join('scripts', ref) : ref;
    if (!existsSync(join(SKILL, bare))) unresolved.push(`${relative(ROOT, f)} -> ${ref}`);
  }
}
check('every file a skill text names exists inside the skill', unresolved.length === 0, unresolved.join('\n'));
const outside = mdFiles.filter((f) => /(^|[\s`(])\.\.\//m.test(read(f))).map((f) => relative(ROOT, f));
check('no skill text reaches outside its directory (../)', outside.length === 0, outside.join('\n'));
const rollCommands = mdFiles.filter((f) => read(f).includes('node <kubik>/scripts/roll.mjs')).length;
check('no command runs a script by a path relative to the project', mdFiles.every((f) => !/(node|bash) scripts\//.test(read(f))));
check('no skill text, hook or script calls bash', [...mdFiles, ...walk(join(ROOT, 'hooks')), ...walk(SCRIPTS).filter((p) => !p.includes('vendor'))].every((f) => !/\bbash\b/.test(read(f))));
check(`every kind and style that throws dice gives a roll command (${rollCommands} files)`, rollCommands >= 8);
const router = ['page.md', 'report.md', 'slides.md', 'figures.md', 'system.md', 'styles/minimal.md', 'styles/brutal.md', 'styles/luxe.md', 'styles/cinema.md', 'quiet.md', 'menu.md', 'method.md', 'frame.md', 'reference.md'];
const missing = router.filter((f) => !skillText.includes('`' + f + '`'));
check('the entry file names every kind, style and shared file', missing.length === 0, missing.join(', '));

console.log('\n## scripts');
for (const s of ['roll.mjs', 'page-audit.mjs', 'deck-shots.mjs', 'lint.mjs', 'deck-runtime.js', 'page-runtime.js', 'browser.mjs']) {
  const r = run('node', ['--check', join(SCRIPTS, s)]);
  check(`${s} parses`, r.status === 0, r.stderr);
}
const roll = (...args) => run(process.execPath, [join(SCRIPTS, 'roll.mjs'), ...args]);
check('roll.mjs with no arguments exits 2 with a usage line', (() => { const r = roll(); return r.status === 2 && /usage/.test(r.stderr); })());
check('roll.mjs refuses an argument that is not group=cards (exit 2)', roll('nonsense').status === 2);
{
  const r = roll('world=a|b|c', 'device:2=x|y|z', 'lean=only*5');
  const lines = r.stdout.trim().split('\n');
  const pair = (lines[1] ?? '').replace('device: ', '').split(' + ');
  check('roll.mjs draws one card per group, two distinct for :2, and strips weights', r.status === 0 && /^world: [abc]$/.test(lines[0]) && pair.length === 2 && pair[0] !== pair[1] && pair.every((c) => 'xyz'.includes(c)) && lines[2] === 'lean: only', r.stdout);
  let heavy = 0;
  for (let i = 0; i < 60; i++) if (roll('g=heavy*50|light').stdout.trim() === 'g: heavy') heavy++;
  check(`a weighted card is drawn far more often (${heavy} of 60 at weight 50)`, heavy >= 50);
  let zero = 0;
  for (let i = 0; i < 20; i++) if (roll('g=gone*0|kept').stdout.trim() === 'g: kept') zero++;
  check('a card weighted *0 is never drawn', zero === 20, `${zero} of 20`);
  check('a group whose cards are all *0 is an error (exit 2)', roll('g=a*0|b*0').status === 2);
  const cyr = roll('цвет=янтарь|прилив', 'эффекты:2=зерно|стекло|блик');
  const cl = cyr.stdout.trim().split('\n');
  check('roll.mjs reads Cyrillic names and cards', cyr.status === 0 && /^цвет: (янтарь|прилив)$/.test(cl[0]) && /^эффекты: (зерно|стекло|блик) \+ (зерно|стекло|блик)$/.test(cl[1]) && cl[1].split(' + ')[0].slice(9) !== cl[1].split(' + ')[1], cyr.stdout + cyr.stderr);
  check('a count above the shelf draws every card once', /^g: ([abc]) \+ (?!\1)([abc]) \+ (?!\1|\2)[abc]$/.test(roll('g:9=a|b|c').stdout.trim()));
  check('a card may hold spaces, plus signs and a star that is no weight', roll('t=A + B*x').stdout.trim().match(/^t: A \+ B\*x$/) !== null);
}
check('roll.mjs refuses a group with no cards (exit 2)', roll('empty=').status === 2);
{ // every roll command written in a skill text runs as written, one card per group
  const bad = []; let seen = 0;
  for (const f of mdFiles) for (const [, body] of read(f).matchAll(/node <kubik>\/scripts\/roll\.mjs \\\n([\s\S]*?)\n```/g)) {
    const groups = [...body.matchAll(/^\s*([\w:]+)="([^"]*)"/gm)].map((m) => `${m[1]}=${m[2]}`);
    const r = roll(...groups); seen++;
    if (!groups.length || r.status !== 0 || r.stdout.trim().split('\n').length !== groups.length) bad.push(`${relative(ROOT, f)}: ${r.stderr || r.stdout}`);
  }
  check(`every roll command in a skill text runs and draws one line per group (${seen})`, seen >= 8 && bad.length === 0, bad.join('\n'));
  const character = /character="([^"]*)"/.exec(read(join(SKILL, 'system.md')))?.[1].split('|') ?? [];
  const analog = ['instrument panel', 'ledger', 'clean office', 'public service', 'workshop', 'clinic', 'control desk'];
  check('the system roll keeps the analog seven beside the current characters', analog.every((c) => character.includes(c)) && character.length > analog.length, character.join(', '));
}
for (const s of ['page-audit.mjs', 'deck-shots.mjs']) {
  const extra = s === 'deck-shots.mjs' ? ['--slides', '3'] : [];
  check(`${s} exits 2 on a missing file and a flag without a value`, [
    run('node', [join(SCRIPTS, s), '/no/such/page.html', ...extra]),
    run('node', [join(SCRIPTS, s), join(FIX, 'good.html'), ...extra, '--out']),
  ].every((r) => r.status === 2 && r.stderr.trim() !== '' && !/\n\s+at /.test(r.stderr)));
  // a missing browser is the machine's fault, not the call's: its own code, and a sentence that names the lint
  const nb = run('node', [join(SCRIPTS, s), join(FIX, 'good.html'), ...extra, '--chrome', '/no/such/browser']);
  check(`${s} exits 3 on a missing browser and says the lint still runs`, nb.status === 3 && /lint\.mjs/.test(nb.stderr) && /Unchecked/.test(nb.stderr) && !/\n\s+at /.test(nb.stderr));
}
{ const b = await import(pathToFileURL(join(SCRIPTS, 'browser.mjs')).href); check('browser.mjs returns null for a path that does not exist, and an existing file or null otherwise', b.findBrowser('/no/such') === null && (b.findBrowser() === null || existsSync(b.findBrowser()))); }
check('page-audit.mjs with no arguments exits 2 with a usage line', (() => { const r = run('node', [join(SCRIPTS, 'page-audit.mjs')]); return r.status === 2 && /usage/.test(r.stderr); })());
check('deck-shots.mjs with no arguments exits 2 with a usage line', (() => { const r = run('node', [join(SCRIPTS, 'deck-shots.mjs')]); return r.status === 2 && /usage/.test(r.stderr); })());

console.log('\n## lint');
{
  const good = run('node', [join(SCRIPTS, 'lint.mjs'), join(FIX, 'good.html')]);
  check('lint passes the sound page', good.status === 0 && /nothing flagged/.test(good.stdout), good.stdout);
  const bad = run('node', [join(SCRIPTS, 'lint.mjs'), join(FIX, 'bad.html')]);
  const want = ['no lang', '0 <main>', 'no target', 'under 12px', 'no :focus-visible'];
  check('lint fails the broken page and names the defects', bad.status === 1 && want.every((w) => bad.stdout.includes(w)), bad.stdout);
  const lint = (f) => run('node', [join(SCRIPTS, 'lint.mjs'), join(FIX, f)]);
  check('lint: motion that ends by itself needs no control', lint('motion-finite.html').status === 0);
  const endless = lint('motion-endless.html');
  check('lint: an endless animation with no control of its own fails and names frame.md section 7', endless.status === 1 && /frame\.md §7/.test(endless.stdout) && /small control/.test(endless.stdout), endless.stdout);
  check('lint: an endless animation inside a region with [data-motion-toggle] passes', lint('motion-region.html').status === 0, lint('motion-region.html').stdout);
  check('lint: a global .motion-toggle still passes', lint('motion-global.html').status === 0, lint('motion-global.html').stdout);
  check('lint warns on a page with no text-wrap: balance / pretty, and the sound page has them', /text-wrap: balance on headings/.test(lint('bad.html').stdout) && !/text-wrap/.test(lint('good.html').stdout));
  const deck = run('node', [join(SCRIPTS, 'lint.mjs'), join(FIX, 'deck.html')]);
  check('lint passes the test deck (wheel, swipe, control bar all present)', deck.status === 0, deck.stdout);
  check('lint with no file exits 2', run('node', [join(SCRIPTS, 'lint.mjs')]).status === 2);
  const runtime = read(join(SCRIPTS, 'deck-runtime.js'));
  check('the test deck carries the shared runtime verbatim', read(join(FIX, 'deck.html')).includes(runtime.trim()));
}

console.log('\n## hooks');
const HOOK = join(ROOT, 'hooks', 'kubik-hook.mjs');
const state = mkdtempSync(join(tmpdir(), 'kubik-hooks-'));
const hook = (event, input = '') => run(process.execPath, [HOOK, event], { input, env: { ...process.env, XDG_STATE_HOME: state } });
check('kubik-hook.mjs parses', run(process.execPath, ['--check', HOOK]).status === 0);
for (const f of ['hooks.json', 'hooks-codex.json']) {
  try {
    const h = json(join(ROOT, 'hooks', f)).hooks;
    check(`${f} wires SessionStart, UserPromptSubmit and SubagentStart to kubik-hook`, ['SessionStart', 'UserPromptSubmit', 'SubagentStart'].every((e) => JSON.stringify(h[e] ?? '').includes('node') && JSON.stringify(h[e] ?? '').includes('kubik-hook.mjs') && !/bash/.test(JSON.stringify(h[e] ?? ''))));
  } catch (e) { check(`${f} is valid JSON`, false, e.message); }
}
const ctx = (r) => { try { return JSON.parse(r.stdout).hookSpecificOutput; } catch { return null; } };
{
  const s = ctx(hook('session'));
  check('session hook prints one short line as additionalContext', s?.hookEventName === 'SessionStart' && /kubik/.test(s.additionalContext) && s.additionalContext.split(/\s+/).length < 80);
  const design = ctx(hook('prompt', JSON.stringify({ session_id: 'a1', prompt: 'сделай презентацию про квартал' })));
  check('prompt hook reminds on a design request', design?.hookEventName === 'UserPromptSubmit');
  const others = ['fix the failing test in parser.go; see the bug report', 'landing the PR tomorrow', 'there is a slider bug', 'shuffle a deck of cards']
    .map((prompt, i) => hook('prompt', JSON.stringify({ session_id: 'b' + i, cwd: '/home/me/dashboard-app', transcript_path: '/x/landing/t.json', prompt })));
  check('prompt hook stays silent on other work, whatever the paths in the event say', others.every((r) => r.stdout.trim() === '' && r.status === 0));
  const system = ctx(hook('prompt', JSON.stringify({ session_id: 'd4', prompt: 'a design system for the back office, with a "UI kit"' })));
  check('prompt hook covers design systems and survives quotes in the prompt', system?.hookEventName === 'UserPromptSubmit');
  const capped = [1, 2, 3, 4].map(() => hook('prompt', JSON.stringify({ prompt: 'нужен лендинг' })).stdout.trim() !== '');
  check('the cap holds without a session id', capped.join() === 'true,true,true,false', capped.join());
  const again = [1, 2, 3, 4].map(() => hook('prompt', JSON.stringify({ session_id: 'c3', prompt: 'a new slide deck please' })).stdout.trim() !== '');
  check('prompt hook reminds at most three times a session', again.join() === 'true,true,true,false', again.join());
  check('subagent hook prints its line', ctx(hook('subagent', '{}'))?.hookEventName === 'SubagentStart');
  check('the hook never exits 2: garbage, empty and truncated stdin all exit 0', ['', 'not json', '{\"prompt\": \"нужен лендинг', '\u0000\u0001', '[1,2]', '{\"prompt\": 7}'].every((input) => ['session', 'prompt', 'subagent', ''].every((ev) => { const r = hook(ev, input); return r.status === 0; })));
check('a hook with no input and an unknown event exits 0 and prints nothing', (() => { const r = hook('nonsense'); return r.status === 0 && r.stdout === ''; })());
}
rmSync(state, { recursive: true, force: true });

console.log('\n## the audit in a browser');
const { findBrowser } = await import(pathToFileURL(join(SCRIPTS, 'browser.mjs')).href);
const chrome = findBrowser(process.env.CHROME_PATH);
if (noBrowser) skip('browser checks', '--no-browser');
else if (!chrome) skip('browser checks', process.env.CHROME_PATH ? `CHROME_PATH points at nothing (${process.env.CHROME_PATH}); this machine, not the package` : 'no Chromium-family browser found; set CHROME_PATH');
else {
  const out = mkdtempSync(join(tmpdir(), 'kubik-audit-'));
  const audit = (file, extra = []) => run('node', [join(SCRIPTS, 'page-audit.mjs'), join(FIX, file), '--out', join(out, file), ...extra]);
  const good = audit('good.html');
  check('a sound page passes: exit 0 and "0 FAIL"', good.status === 0 && /\b0 FAIL/.test(good.stdout), good.stdout.split('\n').filter((l) => /FAIL/.test(l)).join('\n') || good.stderr);
  check('the audit prints FRAME, RICHNESS and the response line', /## FRAME/.test(good.stdout) && /## RICHNESS/.test(good.stdout) && /- response: \d+ :hover rules/.test(good.stdout));
  check('the audit writes its pictures and audit.json', existsSync(join(out, 'good.html', 'audit.json')) && existsSync(join(out, 'good.html', 'desktop-00000.jpg')) && existsSync(join(out, 'good.html', 'phone-00000.jpg')));
  const bad = audit('bad.html');
  const wanted = ['FAIL no sideways scroll on the phone', 'FAIL no text under 12px', 'FAIL no target under 24px', 'FAIL a main landmark and a lang attribute', 'FAIL a skip link'];
  const got = wanted.filter((w) => bad.stdout.includes(w));
  check(`a broken page fails: exit 1 and the ${wanted.length} expected FAIL lines`, bad.status === 1 && got.length === wanted.length, `missing: ${wanted.filter((w) => !got.includes(w)).join('; ')}`);
  const quick = audit('good.html', ['--quick']);
  check('--quick passes the sound page without the dark and reduced-motion runs', quick.status === 0 && !existsSync(join(out, 'good.html', 'desktop-dark.jpg')), quick.stderr);
  {
    const line = (r) => (r.stdout.split('\n').find((l) => /motion that runs on has its own pause/.test(l)) ?? r.stdout.slice(0, 300));
    const fin = audit('motion-finite.html', ['--quick']), end = audit('motion-endless.html', ['--quick']), reg = audit('motion-region.html', ['--quick']), glo = audit('motion-global.html', ['--quick']);
    check('audit: motion that ends by itself needs no control', /PASS motion that runs on has its own pause \(0 running/.test(fin.stdout), line(fin));
    check('audit: an endless animation with no control fails', /FAIL motion that runs on has its own pause \([1-9]\d* running at 6s; [1-9]\d* without a control/.test(end.stdout) && end.status === 1, line(end));
    check('audit: an endless animation in a region with its own control passes, and pressing it stops it', /PASS motion that runs on has its own pause \([1-9]\d* running at 6s; 0 without a control; 0 still running after pressing\)/.test(reg.stdout), line(reg));
    check('audit: a global .motion-toggle still passes', /PASS motion that runs on has its own pause \([1-9]\d* running at 6s; 0 without a control; 0 still running after pressing\)/.test(glo.stdout), line(glo));
  }
  {
    const fails = (r, re) => re.test(r.stdout) && r.status === 1;
    const lay = (f, extra = []) => audit(f, ['--quick', ...extra]);
    const over = lay('layout-text-over-text.html'), cov = lay('layout-covered.html'), flow = lay('layout-flow-image.html'), side = lay('layout-sideways.html'), con = lay('layout-contrast.html');
    const press = lay('layout-press.html', ['--press', '#open']), unpressed = lay('layout-press.html');
    check('audit: two texts printed over each other fail, and the pair is named', fails(over, /FAIL no text printed over other text \([1-9]\d* pairs: "13:40" over "14:00"/), over.stdout.split('\n').filter((l) => /over other text/.test(l)).join('\n'));
    check('audit: text under a block that paints over it fails', fails(cov, /FAIL no text lies under, or runs into, something else \([1-9]\d* covered: "A line that a block now covers" under <div\.lid>/), cov.stdout.split('\n').filter((l) => /something else/.test(l)).join('\n'));
    check('audit: a picture that has outgrown its row onto the text below fails', fails(flow, /FAIL no text lies under, or runs into, something else .*meets <img> in the flow/), flow.stdout.split('\n').filter((l) => /something else/.test(l)).join('\n'));
    check('audit: --press opens an overlay and the defect inside it fails; unpressed, the page passes', fails(press, /FAIL no text lies under, or runs into, something else .*after pressing #open/) && /PASS no text lies under/.test(unpressed.stdout) && unpressed.status === 0, press.stdout.split('\n').filter((l) => /something else|press/.test(l)).join('\n'));
    check('audit: sideways scroll that appears further down the page is found and located', fails(side, /FAIL no sideways scroll on the phone, at any scroll position \(widest 2400px at y \d+\)/), side.stdout.split('\n').filter((l) => /sideways/.test(l)).join('\n'));
    check('audit: text axe leaves to a human is checked against its backing colour and warned about, as computed', /WARN text axe left to a human .*computed .*"Faint text on a plain page\." 1\.\d+:1 of 4\.5/.test(con.stdout), con.stdout.split('\n').filter((l) => /left to a human/.test(l)).join('\n'));
    {
      const far = audit('layout-far-view.html', ['--quick', '--views', '#far']);
      const row = JSON.parse(readFileSync(join(out, 'layout-far-view.html', 'audit.json'), 'utf8')).views?.[0];
      check('audit: a view is measured and photographed with its target in the window, far down the page', far.status === 0 && /target in view yes/.test(far.stdout) && row?.viewAt?.every((x) => x && x.found && x.inView && x.scrollY > 1000), far.stdout.split('\n').filter((l) => /view #/.test(l)).join('\n') + JSON.stringify(row?.viewAt));
    }
    check('audit: --press with no selector exits 2', run('node', [join(SCRIPTS, 'page-audit.mjs'), join(FIX, 'good.html'), '--press']).status === 2);
  }
  const views = audit('views.html', ['--views', '#list,#form']);
  {
    const keep = mkdtempSync(join(tmpdir(), 'kubik-keep-'));
    writeFileSync(join(keep, 'mine.txt'), 'somebody else\'s work');
    const r = run('node', [join(SCRIPTS, 'page-audit.mjs'), join(FIX, 'good.html'), '--out', keep]);
    check('the audit refuses an --out directory that holds other files, and leaves them', r.status === 2 && existsSync(join(keep, 'mine.txt')));
    rmSync(keep, { recursive: true, force: true });
  }
  check('--views checks every named screen: the sound one passes, the broken one fails', views.status === 1 && /PASS view #list is clean/.test(views.stdout) && /FAIL view #form is clean/.test(views.stdout) && existsSync(join(out, 'views.html', 'view-form.jpg')), views.stdout.split('\n').filter((l) => /view #/.test(l)).join('\n'));
  const deck = run('node', [join(SCRIPTS, 'deck-shots.mjs'), join(FIX, 'deck.html'), '--slides', '3', '--out', join(out, 'deck')]);
  check('deck-shots photographs every slide and measures it', deck.status === 0 && (deck.stdout.match(/slide-0\d\.jpg\s+typical text \d+px/g) ?? []).length === 3 && existsSync(join(out, 'deck', 'slide-03.jpg')), deck.stdout || deck.stderr);
  check('deck-shots finds all four controls turning the deck', /right arrow moves\s+\|\s+wheel or trackpad moves\s+\|\s+next button on screen moves\s+\|\s+swipe moves/.test(deck.stdout), deck.stdout.split('\n').filter((l) => /controls/.test(l)).join('\n'));
  const wrong = run('node', [join(SCRIPTS, 'deck-shots.mjs'), join(FIX, 'deck.html'), '--slides', '3', '--hash', '#page-{n}', '--out', join(out, 'deck-wrong')]);
  check('deck-shots warns when the address pattern changes nothing', /WARNING\s+every one of the 3 addresses measured the same/.test(wrong.stdout), wrong.stdout);
  check('deck-shots sees the phone reading mode without sideways scroll', /phone\.jpg\s+scroll width 390px/.test(deck.stdout));
  rmSync(out, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed, ${skipped} skipped`);
process.exit(failed ? 1 : 0);
