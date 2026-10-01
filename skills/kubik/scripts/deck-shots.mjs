#!/usr/bin/env node
// deck-shots: photograph every slide of an HTML deck, in real time, through its hash links.
//
//   node deck-shots.mjs <url-or-html-file> --slides <n> [--out <dir>] [--hash "#{n}"] [--chrome <path>]
//
// Writes slide-01.jpg … slide-NN.jpg (a 1600x900 window) and phone.jpg (390x800, the reading mode)
// into <dir> (default ./deck-shots), and prints one line per slide:
//   the typical text size (the size half the slide's characters are set at or below) and the
//   smallest, both scaled to a 1920-wide canvas; how much text the slide holds; what runs off stage.
// Typical text under 28px on the canvas cannot be read from the back of a room; the smallest is
// usually a footer or a label. Open the pictures: the numbers only point at where to look.
// A last line says which controls turned the deck from slide 1: right arrow, wheel, a next button
// on screen, a swipe.
//
// Needs Node 22+ and a local Chrome or Chromium. No npm install.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { browserArgs, findBrowser, needNode, noBrowserMessage, NO_BROWSER } from './browser.mjs';

needNode(22, 'deck-shots');
const args = process.argv.slice(2);
const USAGE = 'usage: node deck-shots.mjs <url-or-html-file> --slides <n> [--out <dir>] [--hash "#{n}"] [--chrome <path>]';
const stop = (message) => { console.error(message); process.exit(2); };
const flag = (name, fallback) => {
  if (!args.includes(name)) return fallback;
  const v = args[args.indexOf(name) + 1];
  if (v === undefined || v.startsWith('--')) stop(`deck-shots: ${name} needs a value\n${USAGE}`);
  return v;
};
const target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const count = parseInt(flag('--slides', '0'), 10);
if (!target || !count) {
  console.error('usage: node deck-shots.mjs <url-or-html-file> --slides <n> [--out <dir>] [--hash "#{n}"] [--chrome <path>]');
  process.exit(2);
}
if (!/^https?:\/\//.test(target) && !existsSync(resolve(target.replace(/#.*$/, '')))) stop(`deck-shots: no such file: ${target}`);
const base = (/^https?:\/\//.test(target) ? target : pathToFileURL(resolve(target.replace(/#.*$/, ''))).href).replace(/#.*$/, '');
const OUT = resolve(flag('--out', './deck-shots'));
const pattern = flag('--hash', '#{n}');
const GIVEN = flag('--chrome', process.env.CHROME_PATH);
const CHROME = findBrowser(GIVEN);
if (!CHROME) { console.error(noBrowserMessage('deck-shots', GIVEN)); process.exit(NO_BROWSER); }

mkdirSync(OUT, { recursive: true });
const port = await new Promise((res) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const profile = mkdtempSync(join(tmpdir(), 'deck-shots-'));
const chrome = spawn(CHROME, browserArgs(profile, port), { stdio: 'ignore' });
chrome.on('error', (e) => { try { rmSync(profile, { recursive: true, force: true }); } catch {} console.error(`deck-shots: could not start the browser: ${e.message}`); process.exit(NO_BROWSER); });

const PROBE = `(() => {
  const shown = (el) => { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05 && b.bottom > 0 && b.top < innerHeight && b.right > 0 && b.left < innerWidth; };
  const texts = [...document.querySelectorAll('h1,h2,h3,h4,p,li,span,figcaption,td,th,blockquote,text,tspan,div')].filter((el) => shown(el) && [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()) && !el.closest('nav, [role=toolbar], footer.controls, .controls'));
  const px = (el) => { const fs = parseFloat(getComputedStyle(el).fontSize); const svg = el.ownerSVGElement; if (!svg) return fs; const vb = svg.viewBox && svg.viewBox.baseVal; const r = svg.getBoundingClientRect(); return vb && vb.width ? fs * r.width / vb.width : fs; };
  const own = (el) => [...el.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent.trim()).join(' ').length;
  const weighted = texts.map((el) => [px(el), own(el)]).sort((a, b) => a[0] - b[0]);
  const chars = weighted.reduce((n, x) => n + x[1], 0);
  let acc = 0, typical = 0;
  for (const [size, n] of weighted) { acc += n; if (acc >= chars / 2) { typical = size; break; } }
  const off = texts.filter((el) => { const b = el.getBoundingClientRect(); return b.right > innerWidth + 2 || b.bottom > innerHeight + 2 || b.left < -2; }).length;
  const lines = [...new Set(texts.map((el) => [...el.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent.trim()).join(' ')).filter((t) => t.length > 2))];
  return { smallest: weighted.length ? weighted[0][0] : 0, typical, chars, blocks: texts.length, off, lines };
})()`;

try {
  let up = false;
  for (let i = 0; i < 80; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) { up = true; break; } } catch {} await sleep(250); }
  if (!up) throw new Error('the browser did not start (it exited at once, or needs --no-sandbox as root)');
  const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let seq = 0; const pending = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result ?? d); pending.delete(d.id); } };
  // A command the page never answers (a gesture swallowed by a transition, a blocked dialog) must
  // not hang the run: after 20 seconds it resolves empty and the line for that step says so.
  const send = (method, params = {}, quiet = false) => new Promise((res) => {
    const n = ++seq;
    const timer = setTimeout(() => { pending.delete(n); if (!quiet) console.error(`deck-shots: the page did not answer ${method} within 20s`); res({ timedOut: true }); }, 20000);
    pending.set(n, (v) => { clearTimeout(timer); res(v); });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); if (!s || !s.data) throw new Error(`the browser gave no screenshot for ${file}${s && s.timedOut ? ' (timed out: something on the page waits on a network that does not answer)' : ''}`); writeFileSync(join(OUT, file), Buffer.from(s.data, 'base64')); };

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
  const nav0 = await send('Page.navigate', { url: base + pattern.replace('{n}', '1') });
  if (nav0?.errorText) { console.error(`deck-shots: could not load ${base}: ${nav0.errorText}`); process.exitCode = 2; throw new Error('load'); }
  await sleep(4000);
  const seen = new Set();
  let prevLines = null; const twins = [];
  for (let n = 1; n <= count; n++) {
    await send('Runtime.evaluate', { expression: `location.hash = ${JSON.stringify(pattern.replace('{n}', String(n)))}` });
    await sleep(2600);
    const r = await send('Runtime.evaluate', { returnByValue: true, expression: PROBE });
    const v = r.result?.value ?? { smallest: 0, typical: 0, chars: 0, blocks: 0, off: 0 };
    const onCanvas = Math.round(v.smallest * 1920 / 1600);
    const typical = Math.round(v.typical * 1920 / 1600);
    seen.add(`${v.chars}|${v.blocks}|${Math.round(v.typical)}`);
    // a slide that repeats the one before it and adds a line or two is a build exported as a slide
    if (prevLines && prevLines.length >= 2) { const cur = new Set(v.lines || []); const kept = prevLines.filter((l) => cur.has(l)).length; if (kept >= prevLines.length - 1 && kept >= Math.ceil(prevLines.length * 0.8)) twins.push(n); }
    prevLines = v.lines || [];
    const file = `slide-${String(n).padStart(2, '0')}.jpg`;
    await shot(file);
    console.log(`${file}  typical text ${typical}px, smallest ${onCanvas}px (on a 1920 canvas)${typical && typical < 28 ? '  <- too small for a room' : ''}  |  ${v.chars} characters in ${v.blocks} blocks${v.chars > 350 ? '  <- a lot to read on one slide' : ''}${v.off ? `  |  ${v.off} RUN OFF THE STAGE` : ''}`);
  }
  if (twins.length) console.log(`WARNING  ${twins.length} slide(s) repeat the slide before them and add a line or two (${twins.map((n) => n).join(', ')}): a build exported as separate slides. Merge each run into one slide, shown finished, with a .step only where the speaker needs the reveal (slides.md).`);
  if (count > 2 && seen.size === 1) console.log(`WARNING  every one of the ${count} addresses measured the same: the deck does not change slide by ${pattern.replace('{n}', 'N')}. Pass --hash with the deck's own pattern (for example "#slide-{n}"), or the deck is showing its reading mode at this width.`);
  // Controls: from the first slide, does each way of turning the deck do something?
  const first = pattern.replace('{n}', '1');
  const hash = async () => (await send('Runtime.evaluate', { returnByValue: true, expression: 'location.hash' })).result?.value ?? '';
  // Judged by the URL hash. The gesture is repeated up to five times, so a first slide that
  // reveals its builds one press at a time still gets to turn.
  const tried = async (act) => {
    await send('Runtime.evaluate', { expression: `location.hash = ${JSON.stringify(first)}` });
    await sleep(1500);
    const before = await hash();
    for (let i = 0; i < 5; i++) {
      if ((await act()) === false) return 'NOT FOUND';
      await sleep(900);
      if ((await hash()) !== before) return 'moves';
    }
    return 'DOES NOT MOVE';
  };
  const key = await tried(async () => { for (const type of ['rawKeyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39 }); });
  // Wheel and swipe are raised inside the page, as events on whatever sits at the middle of the
  // stage. Input sent through the browser's own channel is delivered only with the next frame,
  // and a still slide may never draw one; an event raised in the page reaches the deck's own
  // handlers at once, which is what is being tested.
  const WHEEL = `(async () => {
    const x = innerWidth / 2, y = innerHeight / 2, el = document.elementFromPoint(x, y) || document.body;
    for (let i = 0; i < 3; i++) { el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 120, deltaMode: 0, clientX: x, clientY: y })); await new Promise((r) => setTimeout(r, 120)); }
    return true;
  })()`;
  const wheel = await tried(async () => { await send('Runtime.evaluate', { awaitPromise: true, expression: WHEEL }); });
  const button = await tried(async () => {
    const r = await send('Runtime.evaluate', { returnByValue: true, expression: `(() => { const words = /next|forward|след|далее|дальше|впер[её]д|→|›|»|▶/i; const b = [...document.querySelectorAll('button, [role=button], a[href]')].find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && words.test((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + el.textContent); }); if (!b) return false; b.click(); return true; })()` });
    return r.result?.value === true;
  });
  const SWIPE = `(async () => {
    const y = innerHeight / 2, from = innerWidth * 0.75, to = innerWidth * 0.25, el = document.elementFromPoint(from, y) || document.body;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const before = location.hash;
    try {                                       // a deck that listens for touch events
      const touch = (x) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y, pageX: x, pageY: y });
      const fire = (type, x, down) => el.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: down ? [touch(x)] : [], targetTouches: down ? [touch(x)] : [], changedTouches: [touch(x)] }));
      fire('touchstart', from, true); await wait(40);
      for (const x of [from - (from - to) / 3, from - 2 * (from - to) / 3, to]) { fire('touchmove', x, true); await wait(30); }
      fire('touchend', to, false); await wait(200);
    } catch (e) {}
    if (location.hash !== before) return true;
    const point = (type, x) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y }));
    point('pointerdown', from); await wait(40); point('pointermove', (from + to) / 2); await wait(30); point('pointermove', to); await wait(30); point('pointerup', to);
    return true;
  })()`;
  const swipe = await tried(async () => { await send('Runtime.evaluate', { awaitPromise: true, expression: SWIPE }); });
  console.log(`controls, from slide 1:  right arrow ${key}  |  wheel or trackpad ${wheel}  |  next button on screen ${button}  |  swipe ${swipe}`);

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 800, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: base });
  await sleep(3500);
  const p = await send('Runtime.evaluate', { returnByValue: true, expression: `(() => { const ts = [...document.querySelectorAll('h1,h2,h3,p,li,figcaption,td,th')].filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && el.textContent.trim(); }); return { w: document.documentElement.scrollWidth, smallest: ts.length ? Math.min(...ts.map((el) => parseFloat(getComputedStyle(el).fontSize))) : 0 }; })()` });
  await shot('phone.jpg');
  const pv = p.result?.value ?? { w: 0, smallest: 0 };
  console.log(`phone.jpg  scroll width ${pv.w}px${pv.w > 390 ? '  <- scrolls sideways' : ''}  |  smallest text ${Math.round(pv.smallest)}px${pv.smallest && pv.smallest < 12 ? '  <- the stage was shrunk instead of reflowed' : ''}`);
  console.log(`pictures: ${OUT}`);
  ws.close();
} catch (e) {
  if (e.message !== 'load') {
    console.error('deck-shots: ' + (e.message || e));
    process.exitCode = /ECONNREFUSED|fetch failed|no screenshot|did not start/.test(String(e.message)) ? NO_BROWSER : 2;
  }
} finally {
  chrome.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
