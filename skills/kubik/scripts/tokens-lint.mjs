#!/usr/bin/env node
// tokens-lint: read one variant (CSS or HTML) and say whether it is built only from a system.
//
//   node tokens-lint.mjs <variant.css|variant.html> --map system.map.json [--map variant.map.json ...]
//
// The map format is `system/map.md`. Every value in the variant is one of: from the system (a
// var() the map names), proposed (a var() a map's `proposed` block names), or forbidden (a colour,
// a length, a duration, an easing, a font or a shadow written by value). Forbidden values FAIL
// with the nearest token; a var() in neither list WARNs and is counted as unknown. The last line is the summary. Exit code:
// 0 when nothing is forbidden, 1 otherwise, 2 on a usage error or a map that breaks the format.
//
// Needs only Node 16+. Nothing is installed.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const die = (msg) => { console.error(msg); process.exit(2); };
const argv = process.argv.slice(2);
let file = null; const mapFiles = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--map') { if (!argv[i + 1]) die('--map needs a file'); mapFiles.push(argv[++i]); }
  else if (!file && !argv[i].startsWith('--')) file = argv[i];
  else die(`unknown argument ${argv[i]}`);
}
if (!file || !mapFiles.length) die('usage: node tokens-lint.mjs <variant.css|variant.html> --map system.map.json [--map variant.map.json ...]');
for (const f of [file, ...mapFiles]) if (!existsSync(resolve(f))) die(`no such file: ${f}`);

// --- colour and length arithmetic, enough to name the nearest token
const NAMED = { black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000', blue: '#0000ff', yellow: '#ffff00', orange: '#ffa500', purple: '#800080', pink: '#ffc0cb', gray: '#808080', grey: '#808080', silver: '#c0c0c0', navy: '#000080', teal: '#008080', maroon: '#800000', lime: '#00ff00', aqua: '#00ffff', cyan: '#00ffff', fuchsia: '#ff00ff', magenta: '#ff00ff', olive: '#808000', brown: '#a52a2a', gold: '#ffd700', crimson: '#dc143c', indigo: '#4b0082', violet: '#ee82ee' };
const gamma = (x) => 255 * Math.max(0, Math.min(1, x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055));
function toRgb(s) {
  s = String(s).trim().toLowerCase();
  if (NAMED[s]) s = NAMED[s];
  let m;
  if ((m = /^#([0-9a-f]{3,8})$/.exec(s))) {
    let h = m[1]; if (h.length < 6) h = [...h].map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const num = (x) => (x.endsWith('%') ? parseFloat(x) * 2.55 : parseFloat(x));
  if ((m = /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)/.exec(s))) return [num(m[1]), num(m[2]), num(m[3])];
  if ((m = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/.exec(s))) {
    const [h, sa, l] = [m[1] % 360, m[2] / 100, m[3] / 100], a = sa * Math.min(l, 1 - l);
    const f = (n) => { const k = (n + h / 30) % 12; return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
    return [f(0), f(8), f(4)];
  }
  if ((m = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/.exec(s))) {
    const L = m[2] ? m[1] / 100 : +m[1], a = m[3] * Math.cos((m[4] * Math.PI) / 180), b = m[3] * Math.sin((m[4] * Math.PI) / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, ss = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [gamma(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss), gamma(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss), gamma(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * ss)];
  }
  return null;
}
function lab([r, g, b]) {   // CIE Lab, D65: distances between these are ΔE
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [R, G, B] = [r, g, b].map(lin);
  const xyz = [(0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, 0.2126 * R + 0.7152 * G + 0.0722 * B, (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883];
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = xyz.map(f);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
const dE = (a, b) => Math.hypot(...lab(a).map((x, i) => x - lab(b)[i]));
const px = (v) => { const m = /^(-?[\d.]+)(px|rem|em)$/.exec(String(v).trim()); return m ? parseFloat(m[1]) * (m[2] === 'px' ? 1 : 16) : null; };
const ms = (v) => { const m = /^(-?[\d.]+)(ms|s)$/.exec(String(v).trim()); return m ? parseFloat(m[1]) * (m[2] === 's' ? 1000 : 1) : null; };

// --- the maps: what the system holds, and what a variant proposes
const sys = new Map(), proposed = new Map(), roles = [], bps = [], claims = [];
for (const f of mapFiles) {
  let j; try { j = JSON.parse(readFileSync(resolve(f), 'utf8')); } catch (e) { die(`${f}: not JSON (${e.message})`); }
  for (const [g, body] of Object.entries(j.groups || {})) {
    if (!/^(file|prose|extracted):\S+$|^screenshot$/.test(body.source || '')) die(`${f}: group "${g}" needs a source: file:<path>, prose:<path>, extracted:<path> or screenshot`);
    if (/^(prose|screenshot)/.test(body.source)) claims.push(`${g} (${body.source})`);
    for (const [role, t] of Object.entries(body.roles || {})) {
      if (t.value === undefined || (!t.var && g !== 'breakpoint')) die(`${f}: ${g}.${role} needs a value and a var (a breakpoint needs only the value)`);
      if (t.var && !/^--[\w-]+$/.test(t.var)) die(`${f}: ${g}.${role}: "${t.var}" is not a custom property name`);
      const r = { group: g, role, var: t.var, value: String(t.value), dark: t.dark === undefined ? null : String(t.dark) };
      roles.push(r); if (t.var) sys.set(t.var, r); if (g === 'breakpoint') bps.push(px(t.value));
    }
  }
  for (const p of j.proposed || []) {
    if (!/^--[\w-]+$/.test(p.var || '') || p.value === undefined) die(`${f}: a proposed token needs a var (--name) and a value`);
    proposed.set(p.var, p);
  }
}

// --- the variant: every declaration with its line, in <style>, style="" or a plain CSS file
const text = readFileSync(resolve(file), 'utf8');
const decls = [], medias = [];
function scan(css, line0) {
  const ctx = []; let buf = '', start = 0, paren = 0, q = null;
  const lineAt = (i) => line0 + css.slice(0, i).split('\n').length - 1;
  const flush = () => {
    const t = buf.trim(), k = t.indexOf(':');
    if (k > 0 && !ctx.some((c) => /^@(font-face|property|page|counter-style)/.test(c)))
      decls.push({ prop: t.slice(0, k).trim().toLowerCase(), value: t.slice(k + 1).trim(), line: lineAt(start + buf.length - buf.trimStart().length) });
    buf = '';
  };
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (buf === '') start = i;
    if (q) { buf += c; if (c === q && css[i - 1] !== '\\') q = null; continue; }
    if (c === '"' || c === "'") { q = c; buf += c; continue; }
    if (c === '/' && css[i + 1] === '*') { const e = css.indexOf('*/', i + 2), end = e < 0 ? css.length : e + 2; buf += css.slice(i, end).replace(/[^\n]/g, ' '); i = end - 1; continue; }
    if (c === '(') paren++; else if (c === ')') paren = Math.max(0, paren - 1);
    if (!paren && c === '{') { const pre = buf.trim(); if (/^@media/i.test(pre)) medias.push({ pre, line: lineAt(start + buf.length - buf.trimStart().length) }); ctx.push(pre); buf = ''; continue; }
    if (!paren && (c === ';' || c === '}')) { flush(); if (c === '}') ctx.pop(); continue; }
    buf += c;
  }
  flush();
}
if (/\.html?$/i.test(file)) {
  for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) scan(m[1], text.slice(0, m.index + m[0].indexOf('>') + 1).split('\n').length);
  for (const m of text.matchAll(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) scan(m[1] ?? m[2], text.slice(0, m.index).split('\n').length);
} else scan(text, 1);

// --- what one value holds: var() references and literals written by value
const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-[\w-]+|emoji|math|fangsong|inherit|initial|unset|revert)$/i;
const SKIP = new Set(['content', 'src', 'quotes', 'grid-template-areas', 'grid-area', 'will-change', 'transition-property', 'animation-name', 'counter-reset', 'counter-increment', 'view-transition-name', 'container-name', 'font-feature-settings', 'font-variation-settings']);
const LEN = /(?<![\w#.§-])(-?(?:\d+\.?\d*|\.\d+))(px|rem|em|pt|pc|cm|mm|in|vw|vh|vmin|vmax|svh|svw|dvh|dvw|lvh|lvw|ch|ex|cqw|cqh|ms|s)(?![\w%-])/gi;
const NAME = new RegExp(`(?<![\\w§-])(${Object.keys(NAMED).join('|')})(?![\\w-])`, 'gi');
function read(prop, value) {
  const refs = [], lits = [];
  let s = value.replace(/!important/i, '').replace(/url\([^)]*\)/gi, ' ');
  if (prop !== 'font-family') s = s.replace(/"[^"]*"|'[^']*'/g, ' ');
  s = s.replace(/var\(\s*(--[\w-]+)\s*[,)]/gi, (_, n) => { refs.push(n); return ' § '; });
  s = s.replace(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*\)/gi, (m) => { if (!m.includes('§')) lits.push({ kind: 'color', text: m }); return ' '; });
  s = s.replace(NAME, (m) => { lits.push({ kind: 'color', text: m }); return ' '; });
  s = s.replace(/\b(?:cubic-bezier|steps|linear)\([^()]*\)/gi, (m) => { lits.push({ kind: 'easing', text: m }); return ' '; });
  s = s.replace(LEN, (m, n, u) => { if (parseFloat(n) !== 0) lits.push({ kind: /^m?s$/i.test(u) ? 'time' : 'length', text: m }); return ' '; });
  if (prop === 'font-family') for (const f of s.split(',').map((x) => x.replace(/["'§]/g, '').trim())) if (f && !GENERIC.test(f)) lits.push({ kind: 'font', text: f });
  if (/^(box|text)-shadow$/.test(prop) && lits.length) return { refs, lits: [{ kind: 'shadow', text: value.trim() }] };
  return { refs, lits };
}
const same = (a, b) => { const x = toRgb(a), y = toRgb(b); return x && y ? dE(x, y) < 1 : String(a).replace(/\s+/g, '').toLowerCase() === String(b).replace(/\s+/g, '').toLowerCase(); };

// custom properties the variant declares: its own aliases of tokens are fine, its own values are not
const local = new Set(), declared = new Set();
for (const d of decls) if (d.prop.startsWith('--')) {
  declared.add(d.prop);
  if (!sys.has(d.prop) && !proposed.has(d.prop) && read(d.prop, d.value).lits.length === 0) local.add(d.prop);
}

const hits = []; let nSys = 0, nProp = 0, nBad = 0, nUnk = 0;
const near = {
  color: (t) => { const c = toRgb(t); if (!c) return null; let best = null; for (const r of roles.filter((r) => r.group === 'color' && r.var)) for (const v of [r.value, r.dark]) { const x = v && toRgb(v); if (x) { const d = dE(c, x); if (!best || d < best.d) best = { d, r, v }; } } return best && `var(${best.r.var}) (${best.v}, ΔE ${best.d.toFixed(1)})`; },
  length: (t) => { const n = px(t); const c = roles.filter((r) => ['space', 'radius', 'type', 'density'].includes(r.group) && r.var && px(r.value) !== null).sort((a, b) => Math.abs(px(a.value) - n) - Math.abs(px(b.value) - n))[0]; return c && `var(${c.var}) (${c.value})`; },
  time: (t) => { const n = ms(t); const c = roles.filter((r) => r.group === 'motion' && r.var && ms(r.value) !== null).sort((a, b) => Math.abs(ms(a.value) - n) - Math.abs(ms(b.value) - n))[0]; return c && `var(${c.var}) (${c.value})`; },
  easing: () => { const c = roles.filter((r) => r.group === 'motion' && r.var && ms(r.value) === null); return c.length ? c.map((r) => `var(${r.var})`).join(', ') : null; },
  shadow: () => { const c = roles.filter((r) => r.group === 'depth' && r.var); return c.length ? c.map((r) => `var(${r.var})`).join(', ') : null; },
  font: (t) => { const c = roles.filter((r) => r.group === 'type' && r.var && px(r.value) === null && !/^[\d.]+$/.test(r.value)); const p = c.find((r) => r.value.toLowerCase().includes(t.toLowerCase())) || c[0]; return p && `var(${p.var})`; },
};
const WHAT = { color: 'a colour', length: 'a length', time: 'a duration', easing: 'an easing', font: 'a font', shadow: 'a shadow' };
const bad = (line, kind, text) => { nBad++; const n = near[kind] && near[kind](text); hits.push({ line, level: 'FAIL', text: `${text} is ${WHAT[kind]} written by value; ${n ? 'nearest: ' + n : 'the map has no token of this kind: propose one'}` }); };
const HAIRLINE = /^(border|outline)(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-width)?$/;

for (const d of decls) {
  if (SKIP.has(d.prop)) continue;
  const { refs, lits } = read(d.prop, d.value);
  if (d.prop.startsWith('--')) {
    const known = sys.get(d.prop);
    if (known) { if (!same(d.value, known.value) && !(known.dark && same(d.value, known.dark))) hits.push({ line: d.line, level: 'WARN', text: `${d.prop}: ${d.value} redefines the system's ${known.value}` }); continue; }
    if (proposed.has(d.prop)) continue;
    if (lits.length) { nBad++; hits.push({ line: d.line, level: 'FAIL', text: `${d.prop}: ${d.value} is a value of its own that no map or proposed block declares; add it to a proposed block, with a reason` }); continue; }
  } else for (const l of lits) { if (l.text === '1px' && HAIRLINE.test(d.prop)) continue; bad(d.line, l.kind, l.text); }
  for (const r of refs) {
    if (sys.has(r)) nSys++; else if (proposed.has(r)) nProp++;
    else if (!local.has(r)) { nUnk++; hits.push({ line: d.line, level: 'WARN', text: `var(${r}) is neither in the map nor proposed` }); }
  }
}
if (bps.length) for (const m of medias) for (const [, n, u] of m.pre.matchAll(/(\d*\.?\d+)(px|em|rem)\b/g)) {
  const w = px(n + u);
  if (bps.some((b) => Math.abs(b - w) <= 1)) nSys++;
  else { nBad++; const c = roles.filter((r) => r.group === 'breakpoint').sort((a, b) => Math.abs(px(a.value) - w) - Math.abs(px(b.value) - w))[0]; hits.push({ line: m.line, level: 'FAIL', text: `${n}${u} in @media is a breakpoint the map does not hold; nearest: ${c.role} (${c.value})` }); }
}
for (const [v, p] of proposed) {
  if (!p.reason) { nBad++; hits.push({ line: 0, level: 'FAIL', text: `proposed ${v} has no reason` }); }
  if (!declared.has(v)) hits.push({ line: 0, level: 'WARN', text: `proposed ${v} is never declared in the variant: a standalone snippet will not carry its value` });
}

for (const h of hits.sort((a, b) => a.line - b.line)) console.log(`${h.level} ${h.line ? 'line ' + h.line + ': ' : ''}${h.text}`);
if (claims.length) console.log(`map claims, not measured: ${claims.join(', ')}`);
console.log(`${nSys + nProp + nBad + nUnk} values: ${nSys} from the system, ${nProp} proposed, ${nBad} forbidden${nUnk ? `, ${nUnk} unknown` : ''}`);
process.exit(nBad ? 1 : 0);
