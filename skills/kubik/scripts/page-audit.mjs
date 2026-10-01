#!/usr/bin/env node
// page-audit: render a page in headless Chrome, in real time, and check it against the web baseline.
//
//   node page-audit.mjs <url-or-html-file> [--out <dir>] [--max <n>] [--chrome <path>] [--views "#a,#b"] [--quick]
//
// --quick skips the dark-scheme, reduced-motion, tablet and script-off runs: the default check.
// The full run is for a full check on request or a piece about to go public. Before any run, `node lint.mjs <file>` reads the
// file without a browser and catches what it can in a second.
//
// --views names further screens of the same page by their hash (a list, a record, a form): each is
// opened at desktop and phone width, checked with axe and the size rules, and photographed, in the
// same run. A page with several screens is only as sound as the one nobody looked at.
//
// Writes into <dir> (default ./page-audit):
//   desktop-<y>.jpg, phone-<y>.jpg   screenshots down the page at 1440x900 and 390x800
//   desktop-dark.jpg                 first view under prefers-color-scheme: dark
//   desktop-reduced-motion.jpg       first view under prefers-reduced-motion: reduce
//   tablet-00000.jpg                 first view at 1024x768 (full run only)
//   desktop-noscript.jpg             first view with script disabled (full run only)
//   view-<name>.jpg, view-<name>-phone.jpg   one picture per extra view
//   audit.json, audit.md             axe-core results and page metrics
// Files this script wrote into <dir> on an earlier run are replaced; a directory holding anything
// else is refused. Give each page its own --out.
// Prints audit.md with two lists: FRAME (one PASS / FAIL / WARN line per check of frame.md)
// and RICHNESS (how much is on the page; no pass mark).
// Exit code: 0 when no FAIL, 1 when at least one FAIL, 2 on a usage or launch error.
//
// Needs Node 22+ (built-in WebSocket and fetch) and a local Chrome or Chromium. No npm install.
// axe-core is vendored beside this file (vendor/axe.min.js, MPL-2.0).
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { browserArgs, findBrowser, needNode, noBrowserMessage, NO_BROWSER } from './browser.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
needNode(22, 'page-audit');
const args = process.argv.slice(2);
const USAGE = 'usage: node page-audit.mjs <url-or-html-file> [--out <dir>] [--max <n>] [--chrome <path>] [--views "#a,#b"]';
const stop = (message) => { console.error(message); process.exit(2); };
const flag = (name, fallback) => {
  if (!args.includes(name)) return fallback;
  const v = args[args.indexOf(name) + 1];
  if (v === undefined || v.startsWith('--')) stop(`page-audit: ${name} needs a value\n${USAGE}`);
  return v;
};
const target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!target) {
  console.error('usage: node page-audit.mjs <url-or-html-file> [--out <dir>] [--max <n>] [--chrome <path>] [--views "#a,#b"]');
  process.exit(2);
}
if (!/^https?:\/\//.test(target) && !existsSync(resolve(target.replace(/#.*$/, '')))) stop(`page-audit: no such file: ${target}`);
const url = /^https?:\/\//.test(target) ? target : pathToFileURL(resolve(target.replace(/#.*$/, ''))).href + (target.includes('#') ? target.slice(target.indexOf('#')) : '');
const OUT = resolve(flag('--out', './page-audit'));
const MAX = parseInt(flag('--max', '10'), 10);
const QUICK = args.includes('--quick');   // desktop and phone only, the default check
const VIEWS = (flag('--views', '') || '').split(',').map((v) => v.trim()).filter(Boolean).map((v) => (v.startsWith('#') ? v : '#' + v));
const GIVEN = flag('--chrome', process.env.CHROME_PATH);
const CHROME = findBrowser(GIVEN);
if (!CHROME) { console.error(noBrowserMessage('page-audit', GIVEN)); process.exit(NO_BROWSER); }

const AXE = readFileSync(join(HERE, 'vendor', 'axe.min.js'), 'utf8');
// --out is cleared of this script's own earlier files and of nothing else. A directory that holds
// other things and no earlier audit is refused: a results folder is not worth somebody's work.
const OURS = /^(desktop|phone|tablet|view)-[\w.-]*\.jpg$|^audit\.(json|md)$/;
if (existsSync(OUT)) {
  const held = readdirSync(OUT);
  if (held.some((f) => !OURS.test(f)) && !held.includes('audit.json')) stop(`page-audit: ${OUT} holds other files; give --out an empty directory or one from an earlier audit`);
  for (const f of held) if (OURS.test(f)) rmSync(join(OUT, f), { force: true });
}
mkdirSync(OUT, { recursive: true });

const freePort = () => new Promise((res, rej) => {
  const s = createServer();
  s.once('error', rej);
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); });
});
const PORT = await freePort();
const PROFILE = mkdtempSync(join(tmpdir(), 'page-audit-'));
const chrome = spawn(CHROME, browserArgs(PROFILE, PORT), { stdio: 'ignore' });
chrome.on('error', (e) => { try { rmSync(PROFILE, { recursive: true, force: true }); } catch {} console.error(`page-audit: could not start the browser: ${e.message}`); process.exit(NO_BROWSER); });

async function waitForChrome() {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return; } catch {}
    await sleep(250);
  }
  throw new Error('chrome did not start');
}

async function openTarget() {
  const r = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
  const t = await r.json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0; const pending = new Map(); const events = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result ?? d); pending.delete(d.id); }
    else if (d.method === 'Page.javascriptDialogOpening') { events.push(d); ws.send(JSON.stringify({ id: ++seq, method: 'Page.handleJavaScriptDialog', params: { accept: true } })); }
    else if (d.method) events.push(d);
  };
  // A command the page never answers must not hang the run: after 30 seconds it resolves empty.
  const send = (method, params = {}) => new Promise((res) => {
    const n = ++seq;
    const timer = setTimeout(() => { pending.delete(n); res({ timedOut: true }); }, 30000);
    pending.set(n, (v) => { clearTimeout(timer); res(v); });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const close = async () => { ws.close(); await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`); };
  return { send, events, close };
}

// Everything measured inside the page. Kept as one expression so it runs in a single round trip.
const METRICS = `(() => {
  const d = document;
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const css = [...d.querySelectorAll('style')].map((s) => s.textContent).join('\\n');
  const count = (re) => (css.match(re) || []).length;
  const heads = [...d.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis).map((h) => h.tagName.toLowerCase() + ' ' + h.textContent.trim().replace(/\\s+/g, ' ').slice(0, 48));
  const levels = heads.map((h) => +h[1]); let skips = 0; for (let i = 1; i < levels.length; i++) if (levels[i] > levels[i - 1] + 1) skips++;
  const interSel = 'a[href], button, input, select, textarea, summary, [role=button], [tabindex]:not([tabindex="-1"])';
  // an element the page itself keeps out of the tab order (a roving-focus group, a frozen sample) is not a keyboard stop
  const inter = [...d.querySelectorAll(interSel)].filter(vis).filter((el) => el.getAttribute('tabindex') !== '-1');
  const size = (el) => { const r = el.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
  const label = (el) => (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 28) || el.tagName.toLowerCase();
  // An inline link inside running text is exempt from the target-size floor (WCAG 2.5.8 exception).
  const inlineLink = (el) => el.tagName === 'A' && getComputedStyle(el).display.startsWith('inline') && el.parentElement && [...el.parentElement.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
  const small24 = inter.filter((el) => { const [w, h] = size(el); return (w < 24 || h < 24) && !inlineLink(el); });
  const small44 = inter.filter((el) => { const [w, h] = size(el); return (w < 44 || h < 44) && !inlineLink(el); });
  const texts = [...d.querySelectorAll('p, li, span, a, button, small, code, dt, dd, label, td, th, h1, h2, h3, h4, text, tspan, div')].filter((el) => vis(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !el.closest('[aria-hidden="true"]'));
  const px = (el) => { const fs = parseFloat(getComputedStyle(el).fontSize); const svg = el.ownerSVGElement; if (!svg) return fs; const vb = svg.viewBox && svg.viewBox.baseVal; const r = svg.getBoundingClientRect(); return vb && vb.width ? fs * (r.width / vb.width) : fs; };
  const tiny = texts.filter((el) => px(el) < 11.95);
  const srOnly = (el) => { const r = el.getBoundingClientRect(); return r.width <= 1 && r.height <= 1; };   // text kept for screen readers only is hidden on purpose
  // text that leaves the shape drawn around it: a badge, a sticker, a pill whose words are wider or taller
  // than the box that has the background or border. Measured against the nearest ancestor that paints.
  const paints = (el) => { const cs = getComputedStyle(el); return (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') || cs.backgroundImage !== 'none' || parseFloat(cs.borderTopWidth) > 0 || cs.clipPath !== 'none'; };
  const escapes = texts.filter((el) => {
    if (srOnly(el)) return false;
    const own = el.getBoundingClientRect();
    if (own.width === 0 || own.height === 0) return false;   // hidden or empty: nothing to escape
    // a closed <details> keeps laying out its content under content-visibility, so the rects are real and wrong
    const fold = el.closest('details:not([open])'); if (fold && !el.closest('summary')) return false;
    if (el.checkVisibility && !el.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true, opacityProperty: true })) return false;
    if (el.ownerSVGElement) {   // a label in a drawing: it stays inside the drawing's own box
      const sb = el.ownerSVGElement.getBoundingClientRect(), tb = own;
      return tb.right > sb.right + 2 || tb.bottom > sb.bottom + 2 || tb.left < sb.left - 2 || tb.top < sb.top - 2;
    }
    let box = el.parentElement; while (box && box !== d.body && !paints(box)) box = box.parentElement;
    if (!box || box === d.body) return false;
    const b = box.getBoundingClientRect(), t = own;
    if (b.width === 0 || b.height === 0 || getComputedStyle(box).overflow !== 'visible') return false;
    // a row that scrolls sideways on purpose (a nav, a chip row) carries its items past the edge by design
    let scroller = el.parentElement; while (scroller && scroller !== box) { const so = getComputedStyle(scroller).overflowX; if (so === 'auto' || so === 'scroll') return false; scroller = scroller.parentElement; }
    return t.right > b.right + 3 || t.bottom > b.bottom + 3 || t.left < b.left - 3 || t.top < b.top - 3;
  });
  const clipped = texts.filter((el) => { const cs = getComputedStyle(el); return !srOnly(el) && (cs.overflowX === 'hidden' || cs.overflowX === 'clip') && el.scrollWidth > el.clientWidth + 2 && cs.textOverflow !== 'ellipsis'; });
  const anims = d.getAnimations();
  const running = anims.filter((a) => a.playState === 'running');
  const infinite = running.filter((a) => a.effect && a.effect.getComputedTiming().iterations === Infinity);
  // what still runs ~6 s after load: is its target inside a region some [data-motion-toggle] controls?
  const regionOf = (b) => { const id = b.getAttribute('aria-controls'); return (id && d.getElementById(id)) || b.closest('[data-motion]'); };
  const regions = [...d.querySelectorAll('[data-motion-toggle]')].map(regionOf).filter(Boolean);
  const globalToggle = !!d.querySelector('.motion-toggle');
  const uncontrolled = running.filter((a) => { const t = a.effect && a.effect.target; const el = t && t.nodeType === 1 ? t : (t && t.parentElement); return !globalToggle && !(el && regions.some((r) => r.contains(el))); }).length;
  const anchors = [...d.querySelectorAll('a[href^="#"]')].filter((a) => a.getAttribute('href').length > 1);
  const deadAnchors = [...new Set(anchors.filter((a) => !d.getElementById(a.getAttribute('href').slice(1))).map((a) => a.getAttribute('href')))];
  const navAnchors = [...new Set([...d.querySelectorAll('nav a[href^="#"], header a[href^="#"]')].filter((a) => a.getAttribute('href').length > 1).map((a) => a.getAttribute('href')))];
  const navVisible = [...new Set([...d.querySelectorAll('nav a[href^="#"], header a[href^="#"]')].filter(vis).filter((a) => a.getAttribute('href').length > 1).map((a) => a.getAttribute('href')))];
  const menuControl = [...d.querySelectorAll('button[aria-expanded], button[aria-controls], summary, [popovertarget]')].filter(vis).length;
  const first = inter[0];
  const skipTarget = first && first.tagName === 'A' && (first.getAttribute('href') || '').startsWith('#') ? d.getElementById(first.getAttribute('href').slice(1)) : null;
  const skipLink = !!(skipTarget && (skipTarget.tagName === 'MAIN' || skipTarget.closest('main') || /skip/i.test(first.textContent)));
  const fam = (el) => el ? getComputedStyle(el).fontFamily.split(',')[0].trim().replace(/["']/g, '') : null;
  // Check each family with the text, weight and style the element really uses: a font served in
  // subsets loads only the ranges and weights the page draws.
  const probes = [d.querySelector('p') || d.body, d.querySelector('h1'), d.querySelector('code, pre, kbd')].filter(Boolean).map((el) => { const cs = getComputedStyle(el); return [fam(el), el.textContent.trim().slice(0, 40) || 'a', cs.fontStyle + ' ' + cs.fontWeight]; });
  const wanted = [...new Set(probes.map((x) => x[0]).filter(Boolean))];
  const generic = /^(serif|sans-serif|monospace|system-ui|ui-sans-serif|ui-serif|ui-monospace|-apple-system|BlinkMacSystemFont)$/i;
  // fonts.check() answers true for a family nobody declared, so a family counts as present only when
  // a @font-face of that name finished loading, or the system has it (then check() with a sample is honest).
  const declared = new Set([...d.fonts].filter((ff) => ff.status === 'loaded').map((ff) => ff.family.replace(/["']/g, '')));
  const anyDeclared = (f) => [...d.fonts].some((ff) => ff.family.replace(/["']/g, '') === f);
  const fontsMissing = [...new Set(probes.filter(([f, sample, face]) => f && !generic.test(f) && !declared.has(f) && (anyDeclared(f) || !d.fonts.check(face + ' 16px "' + f + '"', sample) || /^(Inter|Roboto|Open Sans|Lato|Montserrat|Geist|Manrope|Fraunces|Playfair Display|IBM Plex|Source Serif|Golos|Unbounded|Syne|Archivo|Outfit|Sora|Bricolage|Instrument|Familjen|Newsreader|Literata|Spectral|Public Sans|Figtree|JetBrains Mono|Cormorant|EB Garamond|Anton)/i.test(f))).map((x) => x[0]))];
  return {
    viewport: innerWidth + 'x' + innerHeight,
    scrollWidth: Math.max(d.documentElement.scrollWidth, d.body.scrollWidth),
    pageHeight: d.documentElement.scrollHeight,
    visibleTextChars: (d.body.innerText || '').replace(/\s+/g, ' ').trim().length,
    domNodes: d.querySelectorAll('*').length,
    lang: d.documentElement.getAttribute('lang'),
    title: d.title,
    metaDescription: !!d.querySelector('meta[name="description"][content]'),
    h1Count: d.querySelectorAll('h1').length,
    headingLevelSkips: skips,
    headings: heads.slice(0, 24),
    landmarks: { header: d.querySelectorAll('header').length, nav: d.querySelectorAll('nav').length, main: d.querySelectorAll('main').length, footer: d.querySelectorAll('footer').length },
    skipLink,
    interactive: inter.length,
    targetsUnder24px: small24.length,
    targetsUnder24pxSample: small24.slice(0, 8).map((el) => label(el) + ' ' + size(el).join('x')),
    targetsUnder44px: small44.length,
    textUnder12px: tiny.length,
    textUnder12pxSample: tiny.slice(0, 8).map((el) => label(el) + ' ' + px(el).toFixed(1) + 'px'),
    svgTextUnder12px: [...d.querySelectorAll('svg text, svg tspan')].filter((el) => vis(el) && el.textContent.trim() && px(el) < 11.95).length,
    clippedText: clipped.length,
    textEscapes: escapes.length,
    textEscapesSample: escapes.slice(0, 6).map((el) => label(el)),
    clippedTextSample: clipped.slice(0, 6).map((el) => label(el)),
    bodyFontSize: getComputedStyle(d.body).fontSize,
    animationsRunning: running.length,
    animationsInfinite: infinite.length,
    motionToggles: d.querySelectorAll('[data-motion-toggle]').length,
    globalToggle,
    animationsUncontrolled: uncontrolled,
    canvasCount: d.querySelectorAll('canvas').length,
    svgCount: d.querySelectorAll('svg').length,
    svgNotHiddenNorLabelled: [...d.querySelectorAll('svg')].filter((s) => s.getAttribute('aria-hidden') !== 'true' && !s.getAttribute('aria-label') && !s.getAttribute('aria-labelledby') && !s.getAttribute('role') && !s.closest('[aria-hidden="true"]') && !s.querySelector('title')).length,
    imagesWithoutAlt: [...d.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
    imagesWithoutSize: [...d.querySelectorAll('img')].filter((i) => !(i.hasAttribute('width') && i.hasAttribute('height')) && !getComputedStyle(i).aspectRatio.includes('/')).length,
    ariaLiveRegions: d.querySelectorAll('[aria-live], [role=status], [role=alert]').length,
    deadAnchors, navAnchors, navVisible, menuControl,
    fontFamiliesLoaded: [...new Set([...d.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')))],
    fontFacesLoaded: [...d.fonts].filter((f) => f.status === 'loaded').length,
    fontsWanted: wanted, fontsMissing,
    richness: {
      gradients: count(/(linear|radial|conic)-gradient\\(/g),
      shadows: count(/(box|text)-shadow\\s*:(?!\\s*none)/g) + count(/drop-shadow\\(/g),
      blurs: count(/blur\\(/g),
      blendMaskClip: count(/mix-blend-mode|mask-image|clip-path|background-clip:\\s*text/g),
      keyframes: count(/@keyframes/g),
      depth3d: count(/perspective|rotate[XY3]|translateZ|preserve-3d/g),
      colours: new Set((css.match(/#[0-9a-fA-F]{6}\\b|#[0-9a-fA-F]{3}\\b|oklch\\([^)]*\\)|rgba?\\([^)]*\\)|hsla?\\([^)]*\\)/g) || []).map((s) => s.toLowerCase().replace(/\\s+/g, ''))).size,
      largestTypePx: texts.length ? Math.round(Math.max(...texts.map(px))) : 0,
      svgGraphics: [...d.querySelectorAll('svg')].filter((s) => { const r = s.getBoundingClientRect(); return r.width >= 64 && r.height >= 64; }).length,
    },
    css: {
      prefersReducedMotionBlocks: count(/prefers-reduced-motion/g),
      prefersColorSchemeBlocks: count(/prefers-color-scheme/g),
      colorSchemeProperty: count(/color-scheme\\s*:/g),
      focusVisibleRules: count(/:focus-visible/g),
      hoverRules: count(/:hover/g), activeRules: count(/:active/g), transitionRules: count(/transition(-property)?\\s*:/g),
      outlineNone: count(/outline:\\s*(none|0)\\b/g),
      transitionAll: count(/transition:\\s*all\\b|transition-property:\\s*all\\b/g),
      vhUnits: count(/\\d(vh)\\b/g), dvhOrSvhUnits: count(/\\d(dvh|svh|lvh)\\b/g),
      textWrapRules: count(/text-wrap:/g), containerQueries: count(/@container/g),
      clampUses: count(/clamp\\(/g), willChange: count(/will-change/g), backdropFilter: count(/backdrop-filter/g),
      animationTimeline: count(/animation-timeline/g), scrollMarginRules: count(/scroll-margin|scroll-padding/g),
      hoverMediaQueries: count(/\\(hover:\\s*hover\\)/g),
      importantCount: count(/!important/g),
    },
  };
})()`;

const AXE_RUN = `axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations', 'incomplete'] }).then((r) => ({
  violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes.slice(0, 4).map((n) => ({ target: n.target.join(' '), why: (n.any[0] || n.all[0] || n.none[0] || {}).message || '' })) })),
  incomplete: r.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
}))`;

// Keyboard walk. Before it, every interactive element is stamped with a signature of the styles a
// focus indicator changes; at each Tab stop the signature is recomputed, and no difference means no
// visible indicator. A stop whose own area is covered by another element (a sticky bar) is obscured.
const FOCUS_SIG = `(el) => { const c = getComputedStyle(el); return [c.outlineStyle, c.outlineWidth, c.outlineColor, c.boxShadow, c.borderColor, c.backgroundColor, c.textDecorationLine, c.color].join('|'); }`;
const FOCUS_STAMP = `(() => { const sig = ${FOCUS_SIG}; document.querySelectorAll('a[href], button, input, select, textarea, summary, [role=button], [tabindex]').forEach((el) => { el.__restSig = sig(el); }); const s = document.createElement('style'); s.textContent = 'html{scroll-behavior:auto!important}'; document.head.appendChild(s); window.scrollTo(0, 0); if (document.activeElement) document.activeElement.blur(); return true; })()`;
const FOCUS_PROBE = `(() => {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return null;
  const sig = ${FOCUS_SIG};
  const r = el.getBoundingClientRect();
  const x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), y = Math.min(innerHeight - 1, Math.max(0, r.top + Math.min(r.height / 2, 14)));
  const top = document.elementFromPoint(x, y);
  const name = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 30) || el.tagName.toLowerCase();
  return { name, tag: el.tagName.toLowerCase(), indicator: el.__restSig === undefined ? true : sig(el) !== el.__restSig,
    obscured: !(top && (top === el || el.contains(top) || top.contains(el))), inView: r.bottom > 0 && r.top < innerHeight && r.width > 0 };
})()`;

async function keyboardWalk(send, limit) {
  await send('Runtime.evaluate', { expression: FOCUS_STAMP });
  const stops = [];
  for (let i = 0; i < limit; i++) {
    for (const type of ['rawKeyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await sleep(320);
    let p = await send('Runtime.evaluate', { returnByValue: true, expression: FOCUS_PROBE });
    if (p.result?.value && !p.result.value.inView) {            // still scrolling into view: look again
      await sleep(700);
      p = await send('Runtime.evaluate', { returnByValue: true, expression: FOCUS_PROBE });
    }
    const v = p.result?.value;
    if (!v) { if (stops.length) break; continue; }
    if (stops.length && v.name === stops[0].name && v.tag === stops[0].tag && i > 1) break;   // wrapped round
    stops.push(v);
  }
  return stops;
}

// Press every region's control (and the global one) and count what still runs.
const MOTION_TEST = `(async () => {
  const toggles = [...document.querySelectorAll('[data-motion-toggle]')];
  const global = document.querySelector('.motion-toggle');
  toggles.forEach((b) => { if (b.getAttribute('aria-pressed') !== 'true') b.click(); });
  if (global && global.getAttribute('aria-pressed') !== 'true') global.click();
  await new Promise((r) => setTimeout(r, 500));
  return { after: document.getAnimations().filter((a) => a.playState === 'running').length, toggles: toggles.length, global: !!global };
})()`;

async function run(kind, { width, height, mobile, media = [], audit = true, shots = true, single = null, walk = false, at = url, scriptOff = false }) {
  const { send, events, close } = await openTarget();
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  if (scriptOff) await send('Emulation.setScriptExecutionDisabled', { value: true });
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  if (media.length) await send('Emulation.setEmulatedMedia', { features: media });
  const nav = await send('Page.navigate', { url: at });
  if (nav?.errorText) throw new Error(`could not load ${at}: ${nav.errorText}`);
  await sleep(6000);   // what still moves now has outlived the 5 s that need no control (frame.md §7)
  const shot = async (file) => {
    const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 78 });
    if (!s || !s.data) throw new Error(`the browser gave no screenshot for ${file} (${s && s.timedOut ? 'timed out: a stylesheet, font or script may be waiting on a network that does not answer' : 'no data'})`);
    writeFileSync(join(OUT, file), Buffer.from(s.data, 'base64'));
  };
  const out = { files: [] };
  const m = await send('Runtime.evaluate', { returnByValue: true, expression: METRICS });
  out.metrics = m.result?.value ?? { error: JSON.stringify(m).slice(0, 400) };
  if (audit) {
    await send('Runtime.evaluate', { expression: AXE });
    const a = await send('Runtime.evaluate', { returnByValue: true, awaitPromise: true, expression: AXE_RUN });
    out.axe = a.result?.value ?? { error: JSON.stringify(a).slice(0, 400) };
  }
  if (single) { await shot(single); out.files.push(single); }
  if (shots) {
    const total = out.metrics.pageHeight ?? height;
    const span = Math.max(0, total - height);
    const n = Math.min(MAX, Math.max(1, Math.ceil(span / (height * 0.92)) + 1));
    for (let i = 0; i < n; i++) {
      const y = n === 1 ? 0 : Math.round((span * i) / (n - 1));
      await send('Runtime.evaluate', { expression: `window.scrollTo({ top: ${y}, behavior: 'instant' })` });
      await sleep(i === 0 ? 200 : 1100);
      const f = `${kind}-${String(y).padStart(5, '0')}.jpg`;
      await shot(f); out.files.push(f);
    }
  }
  if (walk) {
    out.walkCap = Math.min(400, (out.metrics.interactive ?? 20) + 4);
    out.walk = await keyboardWalk(send, out.walkCap);
    const pz = await send('Runtime.evaluate', { returnByValue: true, awaitPromise: true, expression: MOTION_TEST });
    out.pause = pz.result?.value ?? { after: 0, toggles: 0, global: false };
  }
  out.dialogs = events.filter((e) => e.method === 'Page.javascriptDialogOpening').length;
  out.errors =[...new Set(events.filter((e) => e.method === 'Runtime.exceptionThrown' || (e.method === 'Log.entryAdded' && e.params.entry.level === 'error' && !/favicon/.test(e.params.entry.url ?? '')))
    .map((e) => e.method === 'Runtime.exceptionThrown' ? (e.params.exceptionDetails.exception?.description?.split('\n')[0] ?? e.params.exceptionDetails.text) : `${e.params.entry.text} ${e.params.entry.url ?? ''}`))];
  await close();
  return out;
}

let result;
try {
  await waitForChrome();
  const desktop = await run('desktop', { width: 1440, height: 900, mobile: false, walk: true });
  const phone = await run('phone', { width: 390, height: 800, mobile: true });
  const dark = QUICK ? { axe: { violations: [] }, files: [] } : await run('dark', { width: 1440, height: 900, mobile: false, media: [{ name: 'prefers-color-scheme', value: 'dark' }], shots: false, single: 'desktop-dark.jpg' });
  const reduced = QUICK ? { metrics: { animationsRunning: 0, animationsInfinite: 0 }, files: [] } : await run('reduced', { width: 1440, height: 900, mobile: false, media: [{ name: 'prefers-reduced-motion', value: 'reduce' }], audit: false, shots: false, single: 'desktop-reduced-motion.jpg' });
  // the full run also looks at a tablet, and at the page with its script off: a reader whose script failed sees the same words
  const tablet = QUICK ? null : await run('tablet', { width: 1024, height: 768, mobile: false, shots: false, single: 'tablet-00000.jpg' });
  const noscript = QUICK ? null : await run('noscript', { width: 1440, height: 900, mobile: false, audit: false, shots: false, single: 'desktop-noscript.jpg', scriptOff: true });
  const views = [];
  for (const hash of VIEWS) {
    const name = hash.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'view';
    const at = url.replace(/#.*$/, '') + hash;
    const wide = await run('view', { width: 1440, height: 900, mobile: false, shots: false, single: `view-${name}.jpg`, at });
    const narrow = await run('view', { width: 390, height: 800, mobile: true, shots: false, single: `view-${name}-phone.jpg`, at });
    views.push({ hash, name, wide, narrow });
  }
  result = { url, desktop, phone, dark: { axe: dark.axe, files: dark.files }, reducedMotion: { animationsRunning: reduced.metrics.animationsRunning, animationsInfinite: reduced.metrics.animationsInfinite, files: reduced.files }, tablet: tablet ? { axe: tablet.axe, scrollWidth: tablet.metrics.scrollWidth, textUnder12px: tablet.metrics.textUnder12px, files: tablet.files } : null, noscript: noscript ? { chars: noscript.metrics.visibleTextChars ?? 0, errors: noscript.errors, files: noscript.files } : null, views };
} catch (e) {
  console.error('page-audit: ' + e.message);
  process.exitCode = /did not start|no screenshot|could not load/.test(e.message) ? NO_BROWSER : 2;
} finally {
  chrome.kill();
  try { rmSync(PROFILE, { recursive: true, force: true }); } catch {}
}
if (process.exitCode === 2 || process.exitCode === NO_BROWSER) process.exit(process.exitCode);

const nodes = (axe) => (axe?.violations ? axe.violations.reduce((n, v) => n + v.nodes, 0) : 0);
const L = [];
L.push(`# Page audit: ${url}`, '');
for (const [name, r] of [['desktop 1440x900', result.desktop], ['phone 390x800', result.phone]]) {
  const m = r.metrics;
  L.push(`## ${name}`);
  L.push(`- page height ${m.pageHeight}px, scroll width ${m.scrollWidth}px, ${m.domNodes} DOM nodes, script errors: ${r.errors.length ? r.errors.join(' / ') : 'none'}`);
  L.push(`- semantics: lang=${m.lang}, h1 x${m.h1Count}, heading level skips ${m.headingLevelSkips}, landmarks header ${m.landmarks.header} / nav ${m.landmarks.nav} / main ${m.landmarks.main} / footer ${m.landmarks.footer}, skip link ${m.skipLink ? 'yes' : 'no'}, live regions ${m.ariaLiveRegions}, dead anchors ${m.deadAnchors.length ? m.deadAnchors.join(' ') : 'none'}`);
  L.push(`- navigation: ${m.navVisible.length} of ${m.navAnchors.length} in-page destinations visible in header/nav, menu controls ${m.menuControl}`);
  L.push(`- targets: ${m.interactive} interactive, ${m.targetsUnder24px} under 24px${m.targetsUnder24px ? ' (' + m.targetsUnder24pxSample.join('; ') + ')' : ''}, ${m.targetsUnder44px} under 44px`);
  L.push(`- text: body ${m.bodyFontSize}, ${m.textUnder12px} text elements under 12px${m.textUnder12px ? ' (' + m.textUnder12pxSample.join('; ') + ')' : ''}, ${m.clippedText} clipped${m.clippedText ? ' (' + m.clippedTextSample.join('; ') + ')' : ''}`);
  L.push(`- motion: ${m.animationsRunning} animations still running 6s after load, ${m.animationsInfinite} endless, ${m.animationsUncontrolled} outside any motion control (${m.motionToggles} region controls, global control ${m.globalToggle ? 'yes' : 'no'}); canvas x${m.canvasCount}`);
  L.push(`- graphics: svg ${m.svgCount} (${m.svgNotHiddenNorLabelled} neither hidden nor labelled), img without alt ${m.imagesWithoutAlt}, img without reserved size ${m.imagesWithoutSize}`);
  L.push(`- fonts: ${m.fontFacesLoaded} faces loaded (${m.fontFamiliesLoaded.join(', ') || 'none'}); first-choice families ${m.fontsWanted.join(', ')}${m.fontsMissing.length ? '; NOT LOADED: ' + m.fontsMissing.join(', ') : ''}`);
  L.push(`- axe: ${r.axe?.violations?.length ?? 'n/a'} rules violated, ${nodes(r.axe)} nodes`);
  for (const v of r.axe?.violations ?? []) {
    L.push(`  - [${v.impact}] ${v.id} x${v.nodes}: ${v.help}`);
    for (const s of v.sample.slice(0, 3)) L.push(`    - ${s.target} :: ${s.why.replace(/\s+/g, ' ').slice(0, 170)}`);
  }
  if (r.axe?.incomplete?.length) L.push(`  - needs a human look: ${r.axe.incomplete.map((i) => i.id + ' x' + i.nodes).join(', ')}`);
  L.push(`- screenshots: ${r.files.join(', ')}`, '');
}
const walk = result.desktop.walk ?? [];
const noIndicator = walk.filter((s) => !s.indicator), obscured = walk.filter((s) => s.obscured && s.inView), offView = walk.filter((s) => !s.inView);
L.push('## keyboard walk (desktop, Tab from the top)');
L.push(`- ${walk.length} stops for ${result.desktop.metrics.interactive} visible interactive elements: ${walk.map((s) => s.name).join(' > ').slice(0, 900)}`);
L.push(`- without a visible focus indicator: ${noIndicator.length}${noIndicator.length ? ' (' + noIndicator.slice(0, 8).map((s) => s.name).join('; ') + ')' : ''}`);
L.push(`- focused but covered by another element: ${obscured.length}${obscured.length ? ' (' + obscured.slice(0, 8).map((s) => s.name).join('; ') + ')' : ''}`);
L.push(`- focused but not visible (zero size or off screen): ${offView.length}${offView.length ? ' (' + offView.slice(0, 8).map((s) => s.name).join('; ') + ')' : ''}`, '');

const c = result.desktop.metrics.css;
L.push('## stylesheet (inline <style> only)');
L.push(`- prefers-reduced-motion blocks ${c.prefersReducedMotionBlocks}, prefers-color-scheme blocks ${c.prefersColorSchemeBlocks}, color-scheme declarations ${c.colorSchemeProperty}, :focus-visible rules ${c.focusVisibleRules}, outline none/0 ${c.outlineNone}, transition: all ${c.transitionAll}`);
L.push(`- vh units ${c.vhUnits}, dvh/svh units ${c.dvhOrSvhUnits}, clamp() ${c.clampUses}, text-wrap rules ${c.textWrapRules}, @container ${c.containerQueries}, animation-timeline ${c.animationTimeline}, scroll-margin/padding ${c.scrollMarginRules}, (hover: hover) queries ${c.hoverMediaQueries}`);
L.push(`- will-change ${c.willChange}, backdrop-filter ${c.backdropFilter}, !important ${c.importantCount}`, '');
L.push('## other modes');
L.push(`- dark scheme: axe ${result.dark.axe?.violations?.length ?? 'n/a'} rules, ${nodes(result.dark.axe)} nodes${(result.dark.axe?.violations ?? []).map((v) => `; ${v.id} x${v.nodes}`).join('')} (desktop-dark.jpg)`);
L.push(`- reduced motion: ${result.reducedMotion.animationsRunning} animations still running, ${result.reducedMotion.animationsInfinite} infinite (desktop-reduced-motion.jpg)`, '');

// The frame. FAIL is a defect to fix before shipping; WARN needs a look and a reason.
const d = result.desktop.metrics, p = result.phone.metrics;
const checks = [];
const add = (level, ok, text) => checks.push(`${ok ? 'PASS' : level} ${text}`);
add('FAIL', result.desktop.errors.length + result.phone.errors.length === 0, 'no script errors');
add('FAIL', (result.desktop.dialogs ?? 0) + (result.phone.dialogs ?? 0) === 0, `the page opens no alert, confirm or prompt (${(result.desktop.dialogs ?? 0) + (result.phone.dialogs ?? 0)} opened)`);
add('FAIL', p.scrollWidth <= 390, `no sideways scroll on the phone (scroll width ${p.scrollWidth}px)`);
add('FAIL', nodes(result.desktop.axe) === 0, `axe clean at desktop (${nodes(result.desktop.axe)} nodes)`);
add('FAIL', nodes(result.phone.axe) === 0, `axe clean on the phone (${nodes(result.phone.axe)} nodes)`);
add('FAIL', nodes(result.dark.axe) === 0, `axe clean in the dark scheme (${nodes(result.dark.axe)} nodes)`);
add('FAIL', d.textUnder12px === 0 && p.textUnder12px === 0, `no text under 12px (desktop ${d.textUnder12px}, phone ${p.textUnder12px})`);
add('FAIL', d.targetsUnder24px === 0 && p.targetsUnder24px === 0, `no target under 24px (desktop ${d.targetsUnder24px}, phone ${p.targetsUnder24px})`);
add('FAIL', d.clippedText === 0 && p.clippedText === 0, `no clipped text (desktop ${d.clippedText}, phone ${p.clippedText})`);
add('WARN', (d.textEscapes ?? 0) === 0 && (p.textEscapes ?? 0) === 0, `text stays inside the shape drawn around it (desktop ${d.textEscapes ?? 0}, phone ${p.textEscapes ?? 0}${(d.textEscapes || p.textEscapes) ? ': ' + [...(d.textEscapesSample ?? []), ...(p.textEscapesSample ?? [])].slice(0, 6).join('; ') : ''}; a badge or a sticker takes its size from its words, frame.md §3)`);
add('FAIL', d.h1Count === 1 && d.headingLevelSkips === 0, `one h1 and no skipped heading level (h1 x${d.h1Count}, skips ${d.headingLevelSkips})`);
add('FAIL', d.landmarks.main === 1 && !!d.lang, `a main landmark and a lang attribute (main x${d.landmarks.main}, lang ${d.lang})`);
add('FAIL', d.skipLink, 'a skip link is the first focusable element');
add('FAIL', d.deadAnchors.length === 0, `no dead in-page links (${d.deadAnchors.join(' ') || 'none'})`);
const dropped = d.navVisible.filter((h) => !p.navVisible.includes(h));
add('FAIL', dropped.length === 0 || p.menuControl > 0, `phone navigation reaches every destination (${dropped.length ? 'not visible on the phone: ' + dropped.join(' ') + (p.menuControl ? ', menu control present' : ', no menu control') : 'all visible'})`);
add('FAIL', result.reducedMotion.animationsRunning === 0, `nothing animates under reduced motion (${result.reducedMotion.animationsRunning} running)`);
const pause = result.desktop.pause ?? { after: 0, toggles: 0, global: false };
add('FAIL', d.animationsRunning === 0 || (d.animationsUncontrolled === 0 && pause.after === 0), `motion that runs on has its own pause (${d.animationsRunning} running at 6s; ${d.animationsUncontrolled} without a control; ${pause.after} still running after pressing)`);
add('WARN', d.canvasCount === 0 || d.motionToggles > 0 || d.globalToggle, `a canvas that animates needs its own pause control too (canvas x${d.canvasCount}, ${d.motionToggles} region controls, global control ${d.globalToggle ? 'yes' : 'no'})`);
add('FAIL', d.fontsMissing.length === 0, `first-choice fonts loaded (${d.fontsMissing.length ? 'missing: ' + d.fontsMissing.join(', ') + ' (no loaded @font-face of that name: the host did not answer, or the link is wrong)' : 'all'})`);
add('FAIL', c.outlineNone === 0 || c.focusVisibleRules > 0, `focus is not removed without a replacement (outline none x${c.outlineNone}, :focus-visible x${c.focusVisibleRules})`);
add('FAIL', walk.length > 0 && noIndicator.length === 0, `every keyboard stop shows a focus indicator (${walk.length} stops, ${noIndicator.length} without)`);
add('FAIL', obscured.length === 0 && offView.length === 0, `no focused element is covered or invisible (${obscured.length} covered, ${offView.length} invisible)`);
const walkCapped = walk.length >= (result.desktop.walkCap ?? 90) - 1;
add('WARN', walkCapped || walk.length >= Math.floor(d.interactive * 0.8), `the keyboard reaches the interactive elements (${walk.length} stops for ${d.interactive} elements${walkCapped ? '; the walk stopped at its own limit of ' + result.desktop.walkCap + ', so this is not a finding' : ''})`);
if (result.tablet) {
  add('FAIL', nodes(result.tablet.axe) === 0 && result.tablet.scrollWidth <= 1024, `clean at a tablet width (axe ${nodes(result.tablet.axe)} nodes, scroll width ${result.tablet.scrollWidth}px; tablet-00000.jpg)`);
  add('WARN', result.tablet.textUnder12px === 0, `no text under 12px on a tablet (${result.tablet.textUnder12px})`);
}
if (result.noscript) {
  const kept = d.visibleTextChars ? result.noscript.chars / d.visibleTextChars : 1;
  add('WARN', kept >= 0.6, `the page is whole without script (${result.noscript.chars} of ${d.visibleTextChars} visible characters remain with script off; desktop-noscript.jpg)`);
}
add('WARN', d.svgTextUnder12px === 0 && p.svgTextUnder12px === 0, `chart and diagram labels stay readable when the drawing scales (SVG text rendered under 12px: desktop ${d.svgTextUnder12px}, phone ${p.svgTextUnder12px})`);
add('WARN', c.focusVisibleRules > 0, `a :focus-visible style is defined (x${c.focusVisibleRules})`);
add('WARN', c.vhUnits === 0 || c.dvhOrSvhUnits > 0, `viewport heights use dvh/svh (vh x${c.vhUnits}, dvh/svh x${c.dvhOrSvhUnits})`);
add('WARN', c.scrollMarginRules > 0 || d.navAnchors.length === 0, `anchors clear a sticky header (scroll-margin/padding x${c.scrollMarginRules})`);
add('WARN', p.targetsUnder44px <= Math.ceil(p.interactive / 3), `no more than a third of phone targets are under 44px (${p.targetsUnder44px} of ${p.interactive} under)`);
add('WARN', d.imagesWithoutAlt === 0 && d.imagesWithoutSize === 0, `images have alt text and reserved size (no alt ${d.imagesWithoutAlt}, no size ${d.imagesWithoutSize})`);
add('WARN', d.metaDescription && !!d.title, 'title and meta description present');
const VIEW_ROWS = (result.views ?? []).map((v) => {
  const w = v.wide.metrics, n = v.narrow.metrics;
  const row = { hash: v.hash, axe: nodes(v.wide.axe) + nodes(v.narrow.axe), small: (w.textUnder12px ?? 0) + (n.textUnder12px ?? 0),
    targets: (w.targetsUnder24px ?? 0) + (n.targetsUnder24px ?? 0), clipped: (w.clippedText ?? 0) + (n.clippedText ?? 0),
    phoneWidth: n.scrollWidth ?? 0, errors: v.wide.errors.length + v.narrow.errors.length };
  row.rules = [...new Set([...(v.wide.axe?.violations ?? []), ...(v.narrow.axe?.violations ?? [])].map((x) => x.id))];
  row.ok = row.axe === 0 && row.small === 0 && row.targets === 0 && row.clipped === 0 && row.phoneWidth <= 390 && row.errors === 0;
  add('FAIL', row.ok, `view ${v.hash} is clean (axe ${row.axe} nodes${row.rules.length ? ': ' + row.rules.join(', ') : ''}, text under 12px ${row.small}, targets under 24px ${row.targets}, clipped ${row.clipped}, phone width ${row.phoneWidth}px, script errors ${row.errors}; view-${v.name}.jpg)`);
  return row;
});
const fails = checks.filter((x) => x.startsWith('FAIL')).length;
const warns = checks.filter((x) => x.startsWith('WARN')).length;
L.push('## FRAME', ...checks.map((x) => '- ' + x), '', `${fails} FAIL, ${warns} WARN. Repair the defect, keep the effect.`, '');
const R = d.richness;
L.push('## RICHNESS (no pass mark: read it against what the style asks for)');
L.push(`- atmosphere: ${R.gradients} gradients, ${R.shadows} shadows, ${R.blurs} blurs, ${R.blendMaskClip} blend/mask/clip effects, ${R.depth3d} 3D transforms`);
L.push(`- graphics: ${R.svgGraphics} SVG graphics of 64px or more, ${d.canvasCount} canvas`);
L.push(`- motion: ${R.keyframes} keyframe animations defined, ${d.animationsRunning} still running 6s after load, ${d.animationsInfinite} endless, ${d.animationsUncontrolled} without a control of their own`);
L.push(`- colour and scale: ${R.colours} distinct colour values, largest type ${R.largestTypePx}px at 1440 wide, ${p.richness.largestTypePx}px on the phone`);
L.push(`- response: ${c.hoverRules} :hover rules, ${c.activeRules} :active rules, ${c.transitionRules} transitions, for ${d.interactive} interactive elements`);
L.push('', 'A number is not a look: open the screenshots.', '');
result.richness = R;

result.frame = { fails, warns, checks };
result.views = VIEW_ROWS;
writeFileSync(join(OUT, 'audit.json'), JSON.stringify(result, null, 1));
writeFileSync(join(OUT, 'audit.md'), L.join('\n'));
console.log(L.join('\n'));
console.log(`evidence: ${OUT}`);
process.exit(fails ? 1 : 0);
