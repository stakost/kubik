#!/usr/bin/env node
// lint: read one HTML file and say, in a second and without a browser, what the audit would fail.
//
//   node lint.mjs <file.html>
//
// It catches what the file itself gives away: structure, sizes written in the stylesheet, the
// habits that broke pages before. It cannot see layout, so a clean lint is not a clean audit: run
// `page-audit.mjs` after it. Exit code: 0 when nothing is flagged, 1 otherwise, 2 on a usage error.
//
// Needs only Node 22+. Nothing is installed.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = process.argv[2];
if (!file || !existsSync(resolve(file))) { console.error('usage: node lint.mjs <file.html>'); process.exit(2); }
const html = readFileSync(resolve(file), 'utf8');

const out = [];
const flag = (level, text, lines = []) => out.push({ level, text, lines });
const lineOf = (index) => html.slice(0, index).split('\n').length;

// --- a small tag walk, enough for structure. Void elements close themselves; the rest nest.
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const tags = [];                 // { name, attrs, index, depth, parents: [names] }
const stack = [];
const tagRe = /<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>|<!--[\s\S]*?-->/g;
let m;
let skip = null;                 // inside <script> or <style>: skip until its close
while ((m = tagRe.exec(html))) {
  if (m[0].startsWith('<!--')) continue;
  const [, close, rawName, rawAttrs, selfClose] = m; const name = rawName.toLowerCase();
  if (skip) { if (close && name === skip) skip = null; continue; }
  if (close) { const i = stack.lastIndexOf(name); if (i >= 0) stack.length = i; continue; }
  const attrs = {};
  for (const a of rawAttrs.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4] ?? '';
  tags.push({ name, attrs, index: m.index, parents: [...stack] });
  if (name === 'script' || name === 'style') { skip = name; continue; }
  if (!VOID.has(name) && !selfClose) stack.push(name);
}
const byName = (n) => tags.filter((t) => t.name === n);
const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((x) => x[1]).join('\n');
const js = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((x) => x[1]).join('\n');
const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '');

// --- document
const htmlTag = byName('html')[0];
if (!htmlTag) flag('FAIL', 'no <html> element: a page checked on its own needs the whole document (a published fragment gets its skeleton later)');
else if (!htmlTag.attrs.lang) flag('FAIL', '<html> has no lang attribute');
if (!/<title>\s*\S/i.test(html)) flag('FAIL', 'no <title>');
if (!byName('meta').some((t) => (t.attrs.name || '').toLowerCase() === 'description' && t.attrs.content)) flag('WARN', 'no meta description');
if (!byName('meta').some((t) => (t.attrs.name || '').toLowerCase() === 'viewport')) flag('FAIL', 'no viewport meta: the phone will render the page at 980px');

// --- landmarks and headings
const mains = byName('main');
if (mains.length !== 1) flag('FAIL', `${mains.length} <main> elements; exactly one is expected`);
for (const t of tags) {
  if (['aside', 'nav', 'header', 'footer'].includes(t.name) && t.parents.includes('main') && !t.parents.includes('article') && !t.parents.includes('section'))
    flag('WARN', `<${t.name}> directly inside <main> (line ${lineOf(t.index)}): a landmark nested in another confuses the page's map`);
}
const headings = tags.filter((t) => /^h[1-6]$/.test(t.name));
const h1s = headings.filter((t) => t.name === 'h1');
if (h1s.length === 0 && /createElement\(['"]h1|<h1\b/.test(js)) flag('WARN', 'no <h1> in the markup; the script makes one, which the audit will count and a reader without script will not see');
else if (h1s.length !== 1) flag('FAIL', `${h1s.length} <h1> elements; exactly one is expected`, h1s.map((t) => lineOf(t.index)));
let prev = 0; const skips = [];
for (const h of headings) { const lvl = +h.name[1]; if (prev && lvl > prev + 1) skips.push(`${h.name} after h${prev} at line ${lineOf(h.index)}`); prev = lvl; }
if (skips.length) flag('FAIL', 'heading levels skip', skips);
for (const t of tags) {
  const implied = { article: 'article', li: 'listitem', nav: 'navigation', main: 'main', button: 'button', ul: 'list', ol: 'list', header: 'banner', footer: 'contentinfo', aside: 'complementary' }[t.name];
  if (implied && t.attrs.role === implied) flag('WARN', `<${t.name} role="${implied}"> repeats the element's own role (line ${lineOf(t.index)})`);
  if (t.name === 'article' && t.attrs.role === 'listitem') flag('WARN', `<article role="listitem"> at line ${lineOf(t.index)}: use <li>`);
}

// --- links and ids
const ids = new Set(tags.filter((t) => t.attrs.id).map((t) => t.attrs.id));
const dupes = tags.filter((t) => t.attrs.id).map((t) => t.attrs.id).filter((id, i, arr) => arr.indexOf(id) !== i);
if (dupes.length) flag('FAIL', 'duplicate ids', [...new Set(dupes)]);
const dead = byName('a').filter((t) => /^#[^!]/.test(t.attrs.href || '') && t.attrs.href.length > 1 && !ids.has(t.attrs.href.slice(1)) && !/^#(\d+|slide-\d+|all|overview)$/.test(t.attrs.href));
if (dead.length) flag('FAIL', 'in-page links with no target', [...new Set(dead.map((t) => t.attrs.href))]);
const firstFocusable = tags.find((t) => (t.name === 'a' && t.attrs.href) || t.name === 'button' || t.name === 'input' || t.name === 'select' || t.name === 'textarea');
if (firstFocusable && !(firstFocusable.name === 'a' && /^#/.test(firstFocusable.attrs.href) && /skip|content|main|содерж/i.test(html.slice(firstFocusable.index, firstFocusable.index + 200))))
  flag('WARN', `the first focusable element (line ${lineOf(firstFocusable.index)}) is not a skip link`);

// --- stylesheet
const sizes = [...css.matchAll(/font-size\s*:\s*([\d.]+)(px|rem|em)\b/gi)].map((x) => ({ v: parseFloat(x[1]), u: x[2].toLowerCase(), at: x.index }));
const rootPx = (() => { const r = /html\s*\{[^}]*font-size\s*:\s*([\d.]+)px/i.exec(css); return r ? parseFloat(r[1]) : 16; })();
const small = sizes.filter((s) => (s.u === 'px' ? s.v : s.v * rootPx) < 12 && (s.u === 'px' ? s.v : s.v * rootPx) > 0);
if (small.length) flag('FAIL', `font-size under 12px declared ${small.length} time(s)`, small.map((s) => `${s.v}${s.u} near css line ${css.slice(0, s.at).split('\n').length}`));
if (/\d(vh)\b/.test(css) && !/\d(dvh|svh)\b/.test(css)) flag('WARN', 'vh heights with no dvh/svh: a phone\'s toolbar eats the bottom');
if (/(?<!calc\([^)]*)100vw/.test(css)) flag('WARN', '100vw: wider than the viewport once a scrollbar shows; use 100% or 100dvw');
const infinite = /animation[^;]*\binfinite\b|animation-iteration-count\s*:\s*infinite/i.test(css);
const motionControl = /data-motion-toggle|motion-toggle/.test(html);
if (infinite && !motionControl) flag('FAIL', 'motion that never ends, and no small control of its own to stop it (a [data-motion-toggle] button on or beside the moving thing; frame.md §7)');
else if (/requestAnimationFrame/.test(js) && !motionControl) flag('WARN', 'requestAnimationFrame in the script and no [data-motion-toggle]: if that loop runs on, it needs its own small pause control (frame.md §7); a draw-once effect does not');
if (/prefers-color-scheme/.test(css) && !/data-theme-switch/.test(html)) flag('WARN', 'two colour schemes in the stylesheet and no theme switch (data-theme-switch buttons; frame.md §7)');
if (!/:hover/.test(css)) flag('WARN', 'no :hover rule: controls do not answer the pointer');
if (!/:active/.test(css) && /<button|<a /.test(html)) flag('WARN', 'no :active rule: controls do not answer the press');
if (!/:focus-visible/.test(css)) flag('FAIL', 'no :focus-visible rule');
if (/outline\s*:\s*(none|0)\b/.test(css) && !/:focus-visible/.test(css)) flag('FAIL', 'outline removed and nothing put in its place');
// a non-breaking space after a one-letter preposition is ordinary typography; a run of words joined by them is what breaks the phone
const nowrapHead = [...html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)].filter((x) => /\S{3,}(?: |&nbsp;)\S{3,}(?: |&nbsp;)\S{3,}/.test(x[1].replace(/<[^>]+>/g, '')) || /white-space\s*:\s*nowrap/.test(x[0]));
if (nowrapHead.length) flag('WARN', `a headline with three or more words joined by non-breaking spaces, or nowrap (${nowrapHead.length}): the usual cause of a page wider than the phone`);
if (/screen\.(width|availWidth|height)/.test(js)) flag('FAIL', 'screen.width in the script: choose a layout from the window, not the screen (slides.md)');
if (byName('input').some((t) => (t.attrs.type || '').toLowerCase() === 'date')) flag('WARN', 'a native date input: its focus ring failed the audit in every build that kept one; a formatted text field passes');
const svgText = [...html.matchAll(/<svg[^>]*viewBox="[^"]*"[^>]*>[\s\S]*?<\/svg>/gi)].filter((x) => /<text/i.test(x[0]) && /font-size\s*[:=]\s*"?(\d+)/i.test(x[0]));
if (svgText.length) flag('WARN', `${svgText.length} SVG drawing(s) with text and a viewBox: the text shrinks with the drawing on a phone; give the drawing a second form under a tablet width (frame.md §3)`);
if (/alert\(|confirm\(|prompt\(/.test(js)) flag('FAIL', 'alert, confirm or prompt in the script');
const families = [...css.matchAll(/font-family\s*:\s*([^;}]+)/gi)].map((x) => x[1].trim()).filter((v) => !/^(inherit|initial|unset|var\(--[\w-]+\))$/i.test(v));
const noGeneric = families.filter((v) => !/(^|,)\s*(serif|sans-serif|monospace|system-ui|ui-sans-serif|ui-serif|ui-monospace|cursive|fantasy|math|emoji)\s*$/i.test(v) && !/var\(--[\w-]+\)\s*$/i.test(v));
if (noGeneric.length) flag('WARN', `font-family with no generic family at the end (${noGeneric.length}): offline, or behind a proxy that blocks the font host, the browser picks the fallback, and without one it picks at random`, [...new Set(noGeneric)].slice(0, 6));

// --- a deck
const isDeck = /<section[^>]*class="[^"]*\bslide\b/i.test(html) && (/ArrowRight/.test(js) || /location\.hash/.test(js));
if (isDeck) {
  if (!/wheel/.test(js)) flag('FAIL', 'a deck with no wheel handler: it does not turn by trackpad (slides.md)');
  if (!/touch|pointer(down|up)/.test(js)) flag('FAIL', 'a deck with no swipe handler');
  if (!/<(nav|[^>]*role="toolbar"|[^>]*class="[^"]*\bcontrols\b)/.test(html)) flag('WARN', 'a deck whose control bar is not in nav, [role=toolbar] or .controls: the slide script counts it as slide text');
  const slides = [...html.matchAll(/<section[^>]*class="[^"]*\bslide\b[^"]*"[^>]*>([\s\S]*?)<\/section>/gi)];
  const heavy = slides.map((x, i) => [i + 1, x[1].replace(/<(aside|div)[^>]*class="[^"]*\bnotes?\b[^"]*"[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length]).filter(([, n]) => n > 350);
  if (heavy.length) flag('WARN', `${heavy.length} slide(s) with more than about 350 characters (notes excluded)`, heavy.slice(0, 12).map(([i, n]) => `slide ${i}: ${n}`));
}

// --- report
const fails = out.filter((o) => o.level === 'FAIL').length, warns = out.filter((o) => o.level === 'WARN').length;
console.log(`## LINT ${resolve(file)}`);
for (const o of out) { console.log(`- ${o.level} ${o.text}`); for (const l of o.lines.slice(0, 12)) console.log(`    ${l}`); }
if (!out.length) console.log('- nothing flagged');
console.log(`\n${fails} FAIL, ${warns} WARN. A clean lint is not a clean audit: run page-audit.mjs next.`);
process.exit(fails ? 1 : 0);
