/* kubik page runtime: the two controls every piece owes its reader, with no opinion about their look.
 *
 * Copy this whole file into the page's own <script> (a published page may load no outside script).
 *
 * 1. The motion control, per element first (frame.md §7). Motion that has to run on carries its
 *    own small button, on or beside the moving thing:
 *      <figure data-motion> ... <button type="button" data-motion-toggle aria-pressed="false" aria-label="Pause the ticker">...</button> </figure>
 *    The button controls the element named by its aria-controls, or else its closest [data-motion]
 *    ancestor. Pressing it pauses or plays every animation in that subtree, toggles class
 *    "motion-off" on that element (the stylesheet's `.motion-off, .motion-off * { animation-play-state:
 *    paused !important }` does the CSS side), sets aria-pressed, and dispatches "kubik:motion" on the
 *    element with detail { on }, so a frame loop scoped to it can listen. Under the system's "reduce
 *    motion" setting every region starts paused, and everything pauses while the tab is hidden.
 *    The label is the page's own, in its own language; the audit finds the control by attribute.
 *
 *    The exception: a page where most of it moves may carry one global button, class "motion-toggle",
 *    anywhere. It sets "motion-off" on <html>, pauses every animation, and a loop checks
 *    `window.kubikMotion.on` or listens for "kubik:motion" on document.
 *
 * 2. The theme switch. Buttons with data-theme-switch="light" | "dark" | "auto":
 *      <button type="button" data-theme-switch="light" aria-pressed="false">Светлая</button>
 *    Pressing one sets data-theme on <html> ("light" or "dark"; "auto" removes it, so the system's
 *    choice applies through prefers-color-scheme), marks the pressed one, and remembers the choice
 *    in localStorage when that is allowed. The stylesheet does the colours:
 *      :root { --ground: #fff }  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --ground: #111 } }
 *      :root[data-theme="dark"] { --ground: #111 }
 *    Only where the piece ships two schemes; a page with one scheme has no switch.
 */
(function () {
  'use strict';
  var root = document.documentElement;

  // --- motion
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var state = { on: !reduce, hidden: false };   // global: "on" is the reader's choice, "hidden" the tab's state
  window.kubikMotion = state;
  var regionOff = [];                           // regions the reader (or reduced motion) has paused
  function regions() {
    var out = [];
    Array.prototype.forEach.call(document.querySelectorAll('[data-motion-toggle]'), function (b) {
      var id = b.getAttribute('aria-controls');
      var el = (id && document.getElementById(id)) || (b.closest && b.closest('[data-motion]'));
      if (el && out.indexOf(el) < 0) out.push(el);
    });
    return out;
  }
  function targetOf(b) {
    var id = b.getAttribute('aria-controls');
    return (id && document.getElementById(id)) || (b.closest && b.closest('[data-motion]'));
  }
  function isOff(el) { return state.hidden || regionOff.indexOf(el) >= 0; }
  function applyRegion(el, notify) {
    var off = isOff(el);
    el.classList.toggle('motion-off', off);
    if (el.getAnimations) el.getAnimations({ subtree: true }).forEach(function (a) { if (off) a.pause(); else if (a.playState === 'paused') a.play(); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-motion-toggle]'), function (b) { if (targetOf(b) === el) b.setAttribute('aria-pressed', String(regionOff.indexOf(el) >= 0)); });
    if (notify) try { el.dispatchEvent(new CustomEvent('kubik:motion', { bubbles: true, detail: { on: !off } })); } catch (e) {}
  }
  function applyMotion() {
    var off = !state.on || state.hidden;
    root.classList.toggle('motion-off', off);
    if (document.getAnimations) document.getAnimations().forEach(function (a) { if (off) a.pause(); else if (a.playState === 'paused' && !pausedByRegion(a)) a.play(); });
    Array.prototype.forEach.call(document.querySelectorAll('.motion-toggle'), function (b) { b.setAttribute('aria-pressed', String(!state.on)); });
    regions().forEach(function (el) { applyRegion(el, false); });
    try { document.dispatchEvent(new CustomEvent('kubik:motion', { detail: { on: !off } })); } catch (e) {}
  }
  function pausedByRegion(a) {
    var t = a.effect && a.effect.target;
    return !!t && regionOff.some(function (el) { return el.contains(t); });
  }
  document.addEventListener('visibilitychange', function () { state.hidden = document.hidden; applyMotion(); });
  document.addEventListener('click', function (e) {
    var r = e.target.closest && e.target.closest('[data-motion-toggle]');
    if (r) {
      var el = targetOf(r);
      if (!el) return;
      var i = regionOff.indexOf(el);
      if (i >= 0) regionOff.splice(i, 1); else regionOff.push(el);
      applyRegion(el, true);
      return;
    }
    var b = e.target.closest && e.target.closest('.motion-toggle');
    if (!b) return;
    state.on = !state.on; applyMotion();
  });
  if (reduce) { regions().forEach(function (el) { regionOff.push(el); }); applyMotion(); regions().forEach(function (el) { applyRegion(el, true); }); }
  // an animation that starts later (a reveal, a build) is paused too while its region or the page is off
  var mo = window.MutationObserver && new MutationObserver(function () {
    if (!document.getAnimations) return;
    var all = !state.on || state.hidden;
    document.getAnimations().forEach(function (a) { if (a.playState === 'running' && (all || pausedByRegion(a))) a.pause(); });
  });
  if (mo) mo.observe(document.body || root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  // --- theme
  var buttons = document.querySelectorAll('[data-theme-switch]');
  if (buttons.length) {
    var remember = function (v) { try { if (v) localStorage.setItem('kubik-theme', v); else localStorage.removeItem('kubik-theme'); } catch (e) {} };
    var current = function () { return root.getAttribute('data-theme') || 'auto'; };
    var mark = function () { Array.prototype.forEach.call(buttons, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-theme-switch') === current())); }); };
    var set = function (v) { if (v === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', v); remember(v === 'auto' ? '' : v); mark(); try { document.dispatchEvent(new CustomEvent('kubik:theme', { detail: { theme: v } })); } catch (e) {} };
    var saved = null; try { saved = localStorage.getItem('kubik-theme'); } catch (e) {}
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
    mark();
    document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-theme-switch]'); if (b) set(b.getAttribute('data-theme-switch')); });
  }
})();

/* The live figure: sample data, one model shared by the build (still frame) and the page (running). */
var KubikLive = (function () {
  var PAST = 48, FUT = 14, BASE = 14 * 60, FEEDMAX = 6;
  var AGENTS = [
    { id: 'triage', gap: [2.5, 5], dur: [0.6, 1.8] },
    { id: 'refunds', gap: [4, 8], dur: [1.2, 3.4] },
    { id: 'researcher', gap: [7, 13], dur: [3.5, 7] },
    { id: 'digest', every: 11, dur: [2.5, 3.5] },
    { id: 'onboarding', gap: [52, 64], dur: [1.5, 3] }
  ];
  var WHY = ['a tool call timed out', 'the model answer was empty', 'a policy check refused the input', 'rate limit reached'];

  function rng(seed) { var a = seed >>> 0; return function () { a += 0x6D2B79F5; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function clock(t) { var m = Math.floor(BASE + t); return pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60); }
  function span(sim) { var s = Math.round(sim * 60); return Math.floor(s / 60) + ':' + pad(s % 60); }
  function between(r, lo, hi) { return lo + r() * (hi - lo); }

  function init() {
    var r = rng(20260502), st = { r: r, now: -80, runs: [], feed: [], ag: [] };
    AGENTS.forEach(function (a, i) {
      st.ag.push({ i: i, id: a.id, cur: null, next: a.every ? -70 : -80 + between(r, 0, a.gap[1]), last: null });
    });
    st.ag[4].next = -41;   // its last run ends 38 minutes before the first frame
    while (st.now < 0) step(st, 0.25);
    st.ag[4].next = 35;   // silence is drawn, and its age grows
    st.runs = st.runs.filter(function (x) { return x.e === null || x.e > -PAST - 5; });
    st.feed = st.feed.slice(0, FEEDMAX);
    return st;
  }

  function step(st, dt) {
    var r = st.r;
    st.now += dt;
    st.ag.forEach(function (g) {
      var a = AGENTS[g.i];
      if (g.cur && st.now >= g.cur.e) {
        var run = g.cur; run.run = false; g.cur = null; g.last = run;
        st.feed.unshift({ t: run.e, a: g.id, st: run.st, txt: 'Took ' + span(run.e - run.s) + (run.st === 'fail' ? '. ' + run.why.charAt(0).toUpperCase() + run.why.slice(1) + '.' : '.') });
        if (st.feed.length > 40) st.feed.length = 40;
        st.fresh = (st.fresh || 0) + 1;
      }
      if (!g.cur && st.now >= g.next) {
        var d = between(r, a.dur[0], a.dur[1]), bad = a.every ? false : r() < 0.15;
        var run2 = { a: g.i, s: st.now, e: st.now + d, st: bad ? 'fail' : 'done', why: WHY[Math.floor(r() * WHY.length)], run: true };
        st.runs.push(run2); g.cur = run2;
        g.next = a.every ? g.next + a.every : st.now + d + between(r, a.gap[0], a.gap[1]);
      }
    });
    if (st.runs.length > 90) st.runs = st.runs.filter(function (x) { return x.run || x.e > st.now - PAST - 5; });
  }

  function pct(st, t) { return (t - (st.now - PAST)) / (PAST + FUT) * 100; }
  var TW = 40, NW = 46;   // widths of a 12px mono tick label and of the bold now label, in px

  /* W is the lane width in px: label placement is decided in pixels, never in percent */
  function axis(st, W) {
    W = W || 520;
    var pm = W / (PAST + FUT), step = pm * 10 >= 54 ? 10 : 20, nx = pm * PAST, o = '', i, k;
    var ticks = '', first = Math.ceil((st.now - PAST) / step) * step;
    for (k = first; k < st.now + FUT; k += step) {
      var tx = (k - (st.now - PAST)) * pm, lab = tx >= 2 && tx + 6 + TW <= nx - 8 - NW - 6;
      ticks += '<i class="tk" style="left:' + tx.toFixed(1) + 'px">' + (lab ? '<b>' + clock(k) + '</b>' : '') + '</i>';
    }
    o += '<div class="ax-over" aria-hidden="true">' + ticks + '<div class="fut" style="left:' + nx.toFixed(1) + 'px">' + (W - nx >= 78 ? '<span>Scheduled</span>' : '') + '</div><div class="nowline" style="left:' + nx.toFixed(1) + 'px"><span>' + clock(st.now) + '</span></div></div>';
    for (i = 0; i < AGENTS.length; i++) {
      var g = st.ag[i], bars = '';
      st.runs.forEach(function (run) {
        if (run.a !== i) return;
        var s = pct(st, run.s), e = pct(st, run.run ? st.now : run.e);
        if (e < 0 || s > 100) return;
        var cut = s < 0; s = Math.max(0, s);
        bars += '<i class="lbar ' + (run.run ? 'run' : run.st) + (cut ? ' cut' : '') + '" style="left:' + s.toFixed(2) + '%;width:' + Math.max(0.9, e - s).toFixed(2) + '%"></i>';
      });
      if (AGENTS[i].every) {
        var px = (g.next - (st.now - PAST)) * pm, pw = Math.max(AGENTS[i].dur[1] * pm, W < 420 ? 22 : 52);
        if (!g.cur && px > nx && px < W) {
          px = Math.min(px, W - pw - 3);
          bars += '<i class="lbar plan" style="left:' + px.toFixed(1) + 'px;width:' + pw.toFixed(1) + 'px">' + (W < 420 ? '' : '<u>' + clock(g.next) + '</u>') + '</i>';
        }
      } else if (!g.cur && g.last) {
        var q = Math.round(st.now - g.last.e);
        if (q >= 12) {
          var gs = Math.max(0, (g.last.e - (st.now - PAST)) * pm + 4), gw = nx - gs - 4, lw = 118;
          bars += '<i class="quiet" style="left:' + gs.toFixed(1) + 'px;width:' + gw.toFixed(1) + 'px"></i>';
          if (gw >= lw + 8) bars += '<em class="quiet-l" style="left:' + (gs + (gw - lw) / 2).toFixed(1) + 'px">quiet for ' + q + ' min</em>';
        }
      }
      o += '<div class="ax-row"><span class="ax-name">' + g.id + '</span><div class="ax-lane">' + bars + '</div></div>';
    }
    return o;
  }

  var ICON = { done: '<i class="ic done" aria-hidden="true"></i>', fail: '<i class="ic fail" aria-hidden="true"></i>' };
  function item(e) {
    return '<li class="fi ' + e.st + '"><time>' + clock(e.t) + '</time>' + ICON[e.st] + '<span class="fa">' + e.a + '</span><span class="ft">' + (e.st === 'fail' ? 'Failed. ' : 'Done. ') + e.txt + '</span></li>';
  }
  function feed(list) { return list.map(item).join(''); }
  function summary(st) {
    var n = 0, f = 0, q = '';
    st.runs.forEach(function (r) { if (!r.run && r.e > st.now - 30) { n++; if (r.st === 'fail') f++; } });
    return 'In the last 30 minutes: ' + n + ' runs finished, ' + f + ' failed.';
  }
  return { init: init, step: step, axis: axis, feed: feed, item: item, summary: summary, clock: clock, PAST: PAST };
})();

var DESIGNS = {
 "board": [
  {
   "g": "#e8edf1",
   "l": "E",
   "dev": "dots numeral",
   "name": "drafting paper and graphite, Plex Sans, an oversized die and a halftone corner"
  },
  {
   "g": "#f7ddd0",
   "l": "C",
   "dev": "grid contents",
   "name": "plum and peach, a manifesto in Instrument Serif over drafting lines"
  },
  {
   "g": "#15120e",
   "l": "A",
   "dev": "tiles grain",
   "name": "black and tan, Plex Sans over a grid of tiles"
  },
  {
   "g": "#f6f6f4",
   "l": "B",
   "dev": "grain tiles",
   "name": "black on white with one electric blue, Bricolage Grotesque, die on the left"
  },
  {
   "g": "#f4eddb",
   "l": "D",
   "dev": "dots contents",
   "name": "cobalt on cream, centred Plex Sans with a numbered margin"
  }
 ],
 "editorial": [
  {
   "g": "#e7e5de",
   "l": "D",
   "dev": "dframe numeral",
   "name": "newsprint and true black, a centred Fraunces title page in double rules"
  },
  {
   "g": "#17140f",
   "l": "C",
   "dev": "ray numeral",
   "name": "ink-dark night edition, Fraunces, a pale red spot and light across the paper"
  },
  {
   "g": "#16171d",
   "l": "A",
   "dev": "side hatch",
   "name": "cold ink, Instrument Serif at great size, a rose spot, marginalia and hatching"
  },
  {
   "g": "#f2eadc",
   "l": "B",
   "dev": "side numeral",
   "name": "warm bone, Newsreader italic with a clay spot, die on the left, marginalia"
  },
  {
   "g": "#e9edef",
   "l": "E",
   "dev": "window dropcap",
   "name": "drafting-paper grey, Fraunces with a yellow marker, a window frame and a drop cap"
  }
 ],
 "night": [
  {
   "g": "#0c0809",
   "l": "E",
   "dev": "aurora",
   "name": "ink and hot coral, Archivo at its widest, aurora bands, die bleeding off the edge"
  },
  {
   "g": "#040720",
   "l": "B",
   "dev": "glowgrid",
   "name": "midnight and electric blue, Unbounded, a glowing grid, die on the left"
  },
  {
   "g": "#121413",
   "l": "A",
   "dev": "grain vignette",
   "name": "graphite and acid lime, Syne, film grain and a vignette"
  },
  {
   "g": "#0a1347",
   "l": "D",
   "dev": "orbs",
   "name": "deep ultramarine and sand, a centred Instrument Serif title under radial blurs"
  },
  {
   "g": "#060606",
   "l": "C",
   "dev": "mesh grain",
   "name": "black, white and one magenta neon, Bricolage Grotesque, a grainy mesh"
  }
 ],
 "blueprint": [
  {
   "g": "#0f3b8c",
   "l": "A",
   "dev": "stamp lamps dots",
   "name": "cyanotype blue, Anton over a dossier stamp with status lamps and halftone"
  },
  {
   "g": "#ecebe4",
   "l": "C",
   "dev": "dframe2 stripes",
   "name": "drafting white, Big Shoulders caps with an orange hazard stripe and a dashed frame"
  },
  {
   "g": "#e8eff9",
   "l": "B",
   "dev": "barcode numeral",
   "name": "paper blue, Anton misregistered in red, a barcode strip and a giant numeral"
  },
  {
   "g": "#0b0b0b",
   "l": "D",
   "dev": "dither stamp",
   "name": "black and hazard yellow, Unbounded caps, one-bit dither and a stamp"
  },
  {
   "g": "#07130c",
   "l": "E",
   "dev": "marks lamps scan",
   "name": "phosphor green on black, Big Shoulders, registration marks and lamps"
  }
 ],
 "letter": [
  {
   "g": "#f4ead2",
   "l": "A",
   "dev": "card",
   "name": "cream and sepia, Fraunces on an index card with a sage ink line"
  },
  {
   "g": "#efe9dd",
   "l": "D",
   "dev": "dear",
   "name": "warm bone, a centred letter in Newsreader beginning \"Dear reader,\""
  },
  {
   "g": "#e8d6b3",
   "l": "B",
   "dev": "tilt",
   "name": "sepia, Instrument Serif, die laid on a tilted index card"
  },
  {
   "g": "#f4efe4",
   "l": "E",
   "dev": "ruled ray",
   "name": "warm bone, handwritten Caveat headline and light across ruled paper"
  },
  {
   "g": "#e8ecef",
   "l": "C",
   "dev": "pin",
   "name": "drafting-paper grey, Newsreader and a clay pinned card, the headline across the top"
  }
 ],
 "candy": [
  {
   "g": "#f7f1e1",
   "l": "A",
   "dev": "band grain",
   "name": "cobalt on cream, Bricolage Grotesque, a ticker band under the die"
  },
  {
   "g": "#ffffff",
   "l": "B",
   "dev": "bigdots",
   "name": "candy pink on white, Unbounded, a large halftone, die on the left"
  },
  {
   "g": "#ff6a1f",
   "l": "C",
   "dev": "numeral",
   "name": "signal orange ground, Syne, one giant numeral behind the die"
  },
  {
   "g": "#2c1e78",
   "l": "D",
   "dev": "dusk dots",
   "name": "indigo into peach, Archivo at its widest, centred, with a halftone"
  },
  {
   "g": "#bff5dd",
   "l": "E",
   "dev": "mint stamp",
   "name": "mint and deep green, Big Shoulders, the headline circling a stamp"
  }
 ],
 "siren": [
  {
   "g": "#d9ff3a",
   "l": "A",
   "dev": "numeral tape dots",
   "name": "acid lime, Anton, a giant numeral and a ticker tape under halftone"
  },
  {
   "g": "#d8c9a6",
   "l": "B",
   "dev": "side dither",
   "name": "tan dossier, Big Shoulders, rotated side text and a dither"
  },
  {
   "g": "#0a0a0a",
   "l": "C",
   "dev": "redact side",
   "name": "black with acid lime, Unbounded, redaction bars and rotated side text"
  },
  {
   "g": "#ffffff",
   "l": "D",
   "dev": "stripes stamp2",
   "name": "white with pink, Archivo at its widest, hazard stripes and a stamp, centred"
  },
  {
   "g": "#1531d8",
   "l": "E",
   "dev": "scan",
   "name": "cobalt with acid lime, Anton, scanlines, die bleeding off the edge"
  }
 ]
};
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var motionOn = function () { var m = window.kubikMotion; return !m || (m.on && !m.hidden); };
  var WORLDS = [
    { id: 'board', name: 'a strict board page', g: '#eef1f6' },
    { id: 'editorial', name: 'a quiet editorial', g: '#f3eee4' },
    { id: 'night', name: 'a cinematic night', g: '#04050b' },
    { id: 'blueprint', name: 'a brutal blueprint', g: '#0f3b8c' },
    { id: 'letter', name: 'a human letter', g: '#f7ead2' },
    { id: 'candy', name: 'a candy shop', g: '#ffffff' },
    { id: 'siren', name: 'an acid poster', g: '#d9ff3a' }
  ];
  var K0 = window.__k0 || { w: 'night', v: 2 }, K0i = 0;   // the page's first look was picked in the head, before the first paint
  var byId = function (id) { for (var i = 0; i < WORLDS.length; i++) if (WORLDS[i].id === id) return WORLDS[i]; return null; };
  K0i = WORLDS.map(function (w) { return w.id; }).indexOf(K0.w); if (K0i < 0) { K0 = { w: 'night', v: 2 }; K0i = 2; }

  /* ---------- fonts: every face is preloaded; a skin is applied only once they are in, at most 300 ms past the landing ---------- */
  var FONT_FACES = ['Anton', 'Archivo', 'Big Shoulders Display', 'Bricolage Grotesque', 'Caveat', 'Fraunces', 'IBM Plex Sans', 'Instrument Serif', 'JetBrains Mono', 'Newsreader', 'Syne', 'Unbounded'], fontsIn = !(doc.fonts && doc.fonts.load), fontWait = [];
  if (!fontsIn) Promise.all(FONT_FACES.map(function (f) { return doc.fonts.load('400 1em "' + f + '"').catch(function () {}); }).concat([doc.fonts.load('italic 400 1em "Fraunces"').catch(function () {}), doc.fonts.load('italic 400 1em "Newsreader"').catch(function () {})])).then(function () { fontsIn = true; fontWait.splice(0).forEach(function (fn) { fn(); }); });
  window.kubikAfterFonts = function (fn) { if (fontsIn) { fn(); return; } var done = false, go = function () { if (!done) { done = true; fn(); } }; fontWait.push(go); window.setTimeout(go, 300); };

  /* ---------- the header wears the world under it ---------- */
  var header = $('#top-bar');
  var headerOwner = null;
  var heroV = 0;
  function claim(owner, id) { headerOwner = owner; header.setAttribute('data-w', id); if (owner === 'hero' && heroV) header.setAttribute('data-v', String(heroV)); else header.removeAttribute('data-v'); }
  function release(owner) { if (headerOwner === owner) { headerOwner = null; header.removeAttribute('data-w'); header.removeAttribute('data-v'); } }

  /* ---------- the nav fades only where it really continues ---------- */
  (function () {
    var nav = $('.top nav'); if (!nav) return;
    function fade() { var r = nav.scrollWidth - nav.clientWidth - 2, x = nav.scrollLeft, f = r <= 0 ? '' : (x > 2 ? (x < r ? 'lr' : 'l') : 'r'); if (f) nav.setAttribute('data-fade', f); else nav.removeAttribute('data-fade'); }
    nav.addEventListener('scroll', fade, { passive: true }); window.addEventListener('resize', fade); fade();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(fade);
  })();

  /* ---------- the menu (narrow widths): a native dialog traps focus, closes on Esc and returns focus ---------- */
  (function () {
    var btn = $('#menu-btn'), dlg = $('#menu'), x = $('#menu-x'); if (!btn || !dlg || !dlg.showModal) return;
    var links = $$('a', dlg), ids = links.map(function (l) { return l.getAttribute('href').slice(1); });
    function mark() {
      var cur = '';
      ids.forEach(function (id) { var s = doc.getElementById(id); if (s && s.getBoundingClientRect().top <= window.innerHeight * 0.4) cur = id; });
      links.forEach(function (l) { if (l.getAttribute('href') === '#' + cur) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
    }
    btn.addEventListener('click', function () { mark(); dlg.showModal(); });
    x.addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = [x].concat(links), i = f.indexOf(doc.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); x.focus(); }
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    links.forEach(function (l) { l.addEventListener('click', function () { dlg.close(); }); });
    window.matchMedia('(min-width: 941px)').addEventListener('change', function (e) { if (e.matches && dlg.open) dlg.close(); });
  })();

  /* ---------- the line under the steps draws once when it comes into view ---------- */
  (function () {
    var st = $('.steps'); if (!st || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    st.classList.add('draw-pre');
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { st.classList.add('draw-in'); o.disconnect(); } }, { threshold: 0.25 });
    o.observe(st);
  })();

  /* ---------- the stage: a scroll set piece with a second form ---------- */
  var stage = $('#stage'), track = $('#track');
  var worlds = $$('.world', stage), N = worlds.length, railLinks = $$('.rail a', stage);
  var ORIGIN = [[50, 60], [14, 86], [86, 16], [50, 50], [88, 88], [12, 14], [50, 100]];
  var choreo = false, active = 0, lastP = -9, near = false, raf = 0;
  var mqChoreo = window.matchMedia('(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var tOf = function (p, i) { return i === 0 ? 1 : clamp((p - (i - 0.6)) / 0.5, 0, 1); };

  function setActive(i) {
    active = i;
    worlds.forEach(function (w, k) { w.classList.toggle('on', k === i); w.inert = (k !== i); });
    railLinks.forEach(function (a, k) { if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    stage.setAttribute('data-w', WORLDS[i].id);
    if (stageInBand && choreo) claim('stage', WORLDS[i].id);
  }
  function progress() { return -track.getBoundingClientRect().top / (stage.offsetHeight || window.innerHeight); }
  function apply(p) {
    var vw = stage.clientWidth, vh = stage.clientHeight, R = Math.hypot(vw, vh), live = motionOn();
    var act = 0, es = [];
    for (var i = 0; i < N; i++) { var t = tOf(p, i); es[i] = live ? ease(t) : (t >= 0.5 ? 1 : 0); if (t >= 0.5) act = i; }
    for (var j = 0; j < N; j++) {
      var w = worlds[j];
      w.style.zIndex = String(j + 1);
      if (j > 0) {
        var e = es[j];
        w.style.clipPath = e >= 1 ? 'none' : 'circle(' + Math.round(e * R) + 'px at ' + ORIGIN[j][0] + '% ' + ORIGIN[j][1] + '%)';
      }
    }
    if (act !== active || !worlds[act].classList.contains('on')) setActive(act);
  }
  function loop() {
    raf = 0;
    if (!choreo) return;
    var p = progress();
    if (p !== lastP) { lastP = p; apply(p); }
    if (near) raf = requestAnimationFrame(loop);
  }
  function kick() { if (choreo && near && !raf) raf = requestAnimationFrame(loop); }
  function enableChoreo() {
    if (choreo) return;
    choreo = true; root.classList.add('has-choreo'); lastP = -9;
    apply(progress()); kick();
    jumpToHash(true);
  }
  function disableChoreo() {
    if (!choreo) return;
    choreo = false; root.classList.remove('has-choreo');
    worlds.forEach(function (w) { w.style.clipPath = ''; w.style.transform = ''; w.style.zIndex = ''; w.inert = false; w.classList.remove('on'); });
    stage.removeAttribute('data-w');
  }
  // far from the stage (jumped past it or back above it) the right world is still the one in focus order
  window.addEventListener('scroll', function () { if (!choreo || near) return; var p = progress(), q = p < -0.3 ? -1 : (p > N ? N + 1 : null); if (q !== null && q !== lastP) { lastP = q; apply(q); } }, { passive: true });
  function syncChoreo() { if (mqChoreo.matches) enableChoreo(); else disableChoreo(); }
  var stageInBand = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { near = e.isIntersecting; if (choreo && !near) { lastP = -9; apply(progress()); } kick(); }); }, { rootMargin: '300px 0px' }).observe(track);
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        stageInBand = e.isIntersecting;
        if (!choreo) return;
        if (stageInBand) claim('stage', WORLDS[active].id); else release('stage');
      });
    }, { rootMargin: '-40px 0px -92% 0px' }).observe(stage);
  }
  function worldTop(i) { return track.getBoundingClientRect().top + window.scrollY + (i + 0.2) * stage.offsetHeight; }
  function goWorld(i, instant) {
    var top = worldTop(i);
    window.scrollTo({ top: top, behavior: instant || !motionOn() ? 'auto' : 'smooth' });
  }
  function jumpToHash(instant) {
    var h = location.hash;
    if (!choreo || h.indexOf('#w-') !== 0) return;
    for (var i = 0; i < N; i++) if ('#w-' + WORLDS[i].id === h) { goWorld(i, instant); return; }
  }
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#w-"]');
    if (!a || !choreo) return;
    var id = a.getAttribute('href').slice(3);
    for (var i = 0; i < N; i++) if (WORLDS[i].id === id) { e.preventDefault(); goWorld(i, false); return; }
  });
  window.addEventListener('hashchange', function () { jumpToHash(false); });
  window.addEventListener('load', function () {
    jumpToHash(true);
    if (!choreo && location.hash.indexOf('#w-') === 0) { var t = doc.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView({ block: 'start', behavior: 'instant' }); }
  });
  window.addEventListener('resize', function () { lastP = -9; kick(); });
  doc.addEventListener('kubik:motion', function (e) { if (e.target !== doc) return; lastP = -9; kick(); drawField(true); });
  if (mqChoreo.addEventListener) mqChoreo.addEventListener('change', syncChoreo);
  syncChoreo();
  // a non-pinned page: the header follows whichever world is under it
  function pickHeader() {
    if (choreo) return;
    var found = null;
    worlds.forEach(function (w) { var r = w.getBoundingClientRect(); if (r.top <= 88 && r.bottom > 88) found = w; });
    if (found) claim('worlds', found.getAttribute('data-w')); else release('worlds');
  }
  if ('IntersectionObserver' in window) {
    var band = new IntersectionObserver(pickHeader, { rootMargin: '-10% 0px -89.5% 0px' });
    worlds.forEach(function (w) { band.observe(w); });
  }

  /* ---------- the hero: a die that answers ---------- */
  var hero = $('.hero'), hit = $('.die-hit'), lean = $('.die-lean'), cube = $('.cube'), shadow = $('.die-shadow');
  var status = $('.hero-status'), skin = $('.hero .skin'), chips = $$('.chip'), throwBtn = $('[data-throw]'), hint = $('.die-hint');
  var FACE = [[0, 0, 1], [1, 0, 0], [0, -1, 0], [0, 1, 0], [-1, 0, 0], [0, 0, -1]];   // faces 1..6 in the cube's own space
  var FACE_UP = [[1, 0, 0], [0, 0, 1], [1, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 0]];   // one in-face axis per face, to land square
  var I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  function mmul(a, b) { var r = new Array(9); for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]; return r; }
  function mvec(m, v) { return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]; }
  function tr(m) { return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]; }
  function rot(x, y, z, a) { var l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l; var c = Math.cos(a), s = Math.sin(a), t = 1 - c; return [t * x * x + c, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, t * y * y + c, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, t * z * z + c]; }
  function css3(R) { return 'matrix3d(' + [R[0], R[3], R[6], 0, R[1], R[4], R[7], 0, R[2], R[5], R[8], 0, 0, 0, 0, 1].join(',') + ')'; }
  function topFace(R, not) { var b = 0, bz = -9; for (var f = 0; f < 6; f++) { if (f === not) continue; var z = mvec(R, FACE[f])[2]; if (z > bz) { bz = z; b = f; } } return b; }
  function squareTo(R, f) {   // the orientation nearest to R that shows face f square to the viewer
    var n = mvec(R, FACE[f]), ax = [n[1], -n[0], 0], s = Math.hypot(ax[0], ax[1]);
    var Q = s < 1e-6 ? (n[2] > 0 ? I3 : rot(0, 1, 0, Math.PI)) : rot(ax[0] / s, ax[1] / s, 0, Math.atan2(s, n[2]));
    var R1 = mmul(Q, R), u = mvec(R1, FACE_UP[f]), phi = Math.atan2(u[1], u[0]);
    var snap = Math.round(phi / (Math.PI / 2)) * (Math.PI / 2);
    return mmul(rot(0, 0, 1, snap - phi), R1);
  }
  function randUnit() { var z = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - z * z); return [r * Math.cos(a), r * Math.sin(a), z]; }

  var R = squareTo(mmul(rot(0.3, 0.8, 0.2, 2.1), I3), K0i < 6 ? K0i : 2);   // the first throw is already on the page: the face of the world picked in the head
  var wv = [0, 0, 0], mode = 'idle', hopT = 0, settleT = 0, R0 = I3, R1 = I3, DUR = 0.55;
  var shown = K0i < 6 ? K0i : -1, from = -1;   // the face the page wears now; a throw never lands on it again
  var silent = false, leanX = 0, leanY = 0, tx = 0, ty = 0, hopY = 0, last = 0, drag = null, loopId = 0, current = K0.w;
  var BASE_X = -17, BASE_Y = -24;
  function render() {
    cube.style.transform = css3(R);
    lean.style.transform = 'translateY(' + hopY.toFixed(1) + 'px) rotateX(' + (BASE_X + leanY).toFixed(2) + 'deg) rotateY(' + (BASE_Y + leanX).toFixed(2) + 'deg)';
    var k = clamp(1 + hopY / 260, 0.55, 1.05);
    shadow.style.transform = 'translateX(-50%) scale(' + k.toFixed(3) + ')'; shadow.style.opacity = String(clamp(0.4 + k * 0.6, 0.2, 1));
  }
  function startLoop() { if (!loopId) { last = performance.now(); loopId = requestAnimationFrame(frame); } }
  function frame(now) {
    loopId = 0;
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var busy = false;
    if (mode === 'plan') {   // a throw decided at its start: the whole tumble arrives on the target, no settle, no correction
      plan.t = Math.min(1, plan.t + dt / plan.dur); var s = plan.t, e = 1 - Math.pow(1 - s, 4);
      R = mmul(mmul(rot(plan.a[0], plan.a[1], plan.a[2], plan.th * e), rot(plan.b[0], plan.b[1], plan.b[2], 6.283185307 * plan.k * e)), plan.R0);
      hopY = -plan.hop * Math.pow(1 - s, 2) * Math.abs(Math.sin(s * 3 * Math.PI));
      if (s >= 1) { R = plan.T; hopY = 0; mode = 'idle'; var f = plan.f; plan = null; land(f); } else busy = true;
    } else if (mode === 'settle') {
      settleT += dt; var s = clamp(settleT / DUR, 0, 1), e = 1 - Math.pow(1 - s, 3);
      var D = mmul(R1, tr(R0)), c = clamp((D[0] + D[4] + D[8] - 1) / 2, -1, 1), ang = Math.acos(c), sa = Math.sin(ang);
      R = sa < 1e-5 ? R1 : mmul(rot((D[7] - D[5]) / (2 * sa), (D[2] - D[6]) / (2 * sa), (D[3] - D[1]) / (2 * sa), ang * e), R0);
      hopY *= 0.8;
      if (s >= 1) { R = R1; hopY = 0; mode = 'idle'; if (silent) silent = false; else land(topFace(R)); } else busy = true;
    }
    var nx = leanX + (tx - leanX) * 0.1, ny = leanY + (ty - leanY) * 0.1;
    if (Math.abs(nx - leanX) > 0.01 || Math.abs(ny - leanY) > 0.01) busy = true;
    leanX = nx; leanY = ny;
    render();
    if (busy || mode === 'drag') startLoop();
  }
  var plan = null;
  function planThrow(b, k, dur) {   // pick the face now, then roll R0 to its target orientation through whole turns about b
    var f; do { f = Math.floor(Math.random() * 6); } while (shown >= 0 && f === shown && shown < 6);
    var T = squareTo(mmul(rot.apply(null, randUnit().concat([Math.random() * 6.283])), I3), f);
    var D = mmul(T, tr(R)), c = clamp((D[0] + D[4] + D[8] - 1) / 2, -1, 1), th = Math.acos(c), sa = Math.sin(th), ax;
    if (th < 1e-5) { ax = [0, 0, 1]; th = 0; }
    else if (sa > 1e-4) ax = [(D[7] - D[5]) / (2 * sa), (D[2] - D[6]) / (2 * sa), (D[3] - D[1]) / (2 * sa)];
    else { var best = [1, 0, 0], bl = -1; for (var i = 0; i < 3; i++) { var v = [D[i] + (i === 0 ? 1 : 0), D[3 + i] + (i === 1 ? 1 : 0), D[6 + i] + (i === 2 ? 1 : 0)], l = Math.hypot(v[0], v[1], v[2]); if (l > bl) { bl = l; best = v; } } ax = [best[0] / bl, best[1] / bl, best[2] / bl]; }
    plan = { R0: R, T: T, a: ax, th: th, b: b, k: k, dur: dur, t: 0, f: f, hop: 60 + Math.random() * 30 };
    from = shown; hopY = 0; mode = 'plan'; throwBtn.setAttribute('aria-busy', 'true'); startLoop();
  }
  function throwDie() {
    if (mode === 'settle' || mode === 'plan') return;
    if (!motionOn()) {   // lands without tumbling
      var f = Math.floor(Math.random() * 5); if (shown >= 0 && f >= shown) f++; if (shown < 0) f = Math.floor(Math.random() * 6);
      R = squareTo(mmul(rot.apply(null, randUnit().concat([Math.random() * 6])), I3), f);
      hopY = 0; render(); land(topFace(R)); return;
    }
    planThrow(randUnit(), 2 + Math.floor(Math.random() * 2), 1.1 + Math.random() * 0.4);
  }
  function land(f) {
    throwBtn.removeAttribute('aria-busy');
    setWorld(WORLDS[f].id, 'thrown ' + (f + 1));
  }
  // pointer: lean toward it, drag to turn, flick to throw, tap to throw
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  hero.addEventListener('pointermove', function (e) {
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true;
    if (!fine.matches || !motionOn() || drag) return;
    var r = hit.getBoundingClientRect();
    tx = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2), -1, 1) * 14;
    ty = -clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2), -1, 1) * 10;
    startLoop();
  });
  hero.addEventListener('pointerleave', function () { ptr.on = false; tx = 0; ty = 0; startLoop(); });
  hit.addEventListener('pointerdown', function (e) {
    if (e.button > 0 || mode === 'settle' || mode === 'plan') return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t0: performance.now(), moved: 0, s: [] };
    try { hit.setPointerCapture(e.pointerId); } catch (x) {}
    mode = 'drag'; tx = 0; ty = 0;
  });
  hit.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y, d = Math.hypot(dx, dy);
    drag.x = e.clientX; drag.y = e.clientY; drag.moved += d;
    drag.s.push([performance.now(), dx, dy]); if (drag.s.length > 8) drag.s.shift();
    if (d > 0 && motionOn()) { R = mmul(rot(-dy / d, dx / d, 0, d * 0.012), R); render(); }
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var d = drag; drag = null; mode = 'idle';
    try { hit.releasePointerCapture(d.id); } catch (x) {}
    var now = performance.now(), sx = 0, sy = 0, t0 = now;
    d.s.forEach(function (s) { if (now - s[0] < 90) { sx += s[1]; sy += s[2]; if (s[0] < t0) t0 = s[0]; } });
    var el = Math.max(16, now - t0), vx = sx / el * 1000, vy = sy / el * 1000, sp = Math.hypot(vx, vy);
    if (d.moved < 7 && now - d.t0 < 450) { throwDie(); return; }
    if (!motionOn()) { R = squareTo(R, topFace(R)); render(); land(topFace(R)); return; }
    if (sp > 260) { planThrow([-vy / sp, vx / sp, (Math.random() - 0.5) * 0.3], clamp(Math.round(2 + sp / 1400), 2, 5), 1.2 + clamp(sp / 4000, 0, 0.3)); }
    else { R0 = R; R1 = squareTo(R, topFace(R)); settleT = 0; mode = 'settle'; startLoop(); }
  }
  hit.addEventListener('pointerup', endDrag); hit.addEventListener('pointercancel', endDrag);
  hit.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); throwDie(); } });
  throwBtn.addEventListener('click', throwDie);
  chips.forEach(function (c) { c.addEventListener('click', function () {
    var id = c.getAttribute('data-world'), idx = WORLDS.indexOf(byId(id));
    setWorld(id, 'asked');
    if (idx < 6 && motionOn() && mode === 'idle') { R0 = R; R1 = squareTo(R, idx); settleT = 0; mode = 'settle'; silent = true; startLoop(); }
  }); });
  if (window.matchMedia('(pointer: coarse)').matches && hint) hint.textContent = 'Tap it, drag it, or flick it';

  var skinBusy = null, lastV = {};
  function pickV(id) {   // a random design of the direction, never the one shown last for it
    var v = 1 + Math.floor(Math.random() * 5);
    if (lastV[id] && v === lastV[id]) v = 1 + (v % 5);
    return v;
  }
  function wear(id, v) {   // the hero takes a direction and one of its five designs
    var d = DESIGNS[id][v - 1];
    current = id; heroV = v; lastV[id] = v;
    hero.setAttribute('data-w', id); hero.setAttribute('data-v', String(v)); hero.setAttribute('data-l', d.l); hero.setAttribute('data-dev', d.dev);
    hero.setAttribute('data-n', String(WORLDS.indexOf(byId(id)) + 1));
    if (heroInBand) claim('hero', id);
  }
  function setWorld(id, how, forceV) {
    var w = byId(id); if (!w) return;
    shown = WORLDS.indexOf(w); if (shown > 5) shown = -1;
    var v = forceV || pickV(id), d = DESIGNS[id][v - 1];
    chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-world') === id)); });
    var tail = ', design <b>' + v + ' of 5</b>, ' + d.name + '.';
    var msg;
    if (how === 'asked') msg = 'Asked for <b>' + w.name + '</b> by name: design <b>' + v + ' of 5</b>, ' + d.name + '.';
    else msg = 'Landed on <b>' + how.replace('thrown ', '') + '</b>: <b>' + w.name + '</b>' + tail;
    status.innerHTML = msg;
    if (forceV) { header.style.transition = 'none'; hero.style.transition = 'none'; setTimeout(function () { header.style.transition = ''; hero.style.transition = ''; }, 200); }
    var finish = function () { window.kubikAfterFonts(function () { wear(id, v); skin.style.cssText = ''; skinBusy = null; drawField(true); }); };
    if (skinBusy) { skinBusy.cancel(); skinBusy = null; }
    if (forceV || !motionOn() || !skin.animate) { finish(); return; }
    var hr = hero.getBoundingClientRect(), dr = hit.getBoundingClientRect();
    var cx = dr.left + dr.width / 2 - hr.left, cy = dr.top + dr.height / 2 - hr.top, Rr = Math.hypot(Math.max(cx, hr.width - cx), Math.max(cy, hr.height - cy)) + 40;
    skin.style.background = d.g;
    var a = skin.animate([{ clipPath: 'circle(0px at ' + cx + 'px ' + cy + 'px)' }, { clipPath: 'circle(' + Math.round(Rr) + 'px at ' + cx + 'px ' + cy + 'px)' }], { duration: 950, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' });
    skinBusy = a; ripple = { x: cx, y: cy, t0: performance.now() }; drawField(true);
    var flipped = false, flip = function () { if (flipped) return; flipped = true; window.kubikAfterFonts(function () { wear(id, v); drawField(true); }); };
    setTimeout(flip, 520);
    a.onfinish = function () { flip(); skin.style.cssText = ''; a.cancel(); if (skinBusy === a) skinBusy = null; };
  }
  // a test hook: #h-night-3 opens the page already wearing that design
  var hm = /^#h-([a-z]+)-([1-5])$/.exec(location.hash); if (hm && DESIGNS[hm[1]]) window.setTimeout(function () { setWorld(hm[1], 'asked', +hm[2]); }, 0);
  window.kubikHero = { set: function (id, n) { setWorld(id, 'asked', n); }, designs: DESIGNS };

  /* ---------- the field behind the hero: drawn in code, answers the pointer and the throw ---------- */
  var cv = $('.field'), ctx = cv.getContext && cv.getContext('2d'), ptr = { x: 0, y: 0, on: false }, ripple = null;
  var pts = [], pw = 0, ph = 0, dpr = 1, heroVisible = true, heroInBand = true, fieldRaf = 0, seed = 7;
  var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  function buildPts() {
    var r = hero.getBoundingClientRect(); pw = Math.round(r.width); ph = Math.round(r.height); dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = pw * dpr; cv.height = ph * dpr; pts = []; seed = 7;
    var m = current, i, x, y, sp = pw < 700 ? 38 : 48;
    if (m === 'night' || m === 'candy') { var n = m === 'night' ? Math.round(pw * ph / 5200) : Math.round(pw * ph / 26000); for (i = 0; i < n; i++) { x = rnd() * pw; y = rnd() * ph; if (m === 'candy' && pw > 900 && x < pw * 0.56 && y > ph * 0.12 && y < ph * 0.92) continue; pts.push({ x: x, y: y, s: m === 'night' ? 0.6 + rnd() * 1.9 : 7 + rnd() * 16, p: rnd() * 6.28, c: Math.floor(rnd() * 4) }); } }
    else if (m === 'editorial') { for (y = sp; y < ph; y += sp) pts.push({ x: 0, y: y, s: 1, p: 0, c: 0 }); }
    else for (y = sp / 2; y < ph; y += sp) for (x = sp / 2; x < pw; x += sp) pts.push({ x: x, y: y, s: 1, p: x * 0.01 + y * 0.013, c: 0 });
  }
  var fieldUntil = 0;
  function drawField(force) {
    if (!ctx) return;
    if (force) { var r = hero.getBoundingClientRect(); if (Math.round(r.width) !== pw || Math.round(r.height) !== ph || !pts.length || pts.mode !== current) { buildPts(); pts.mode = current; } }
    var live = motionOn(), t = live ? performance.now() / 1000 : 0, cs = getComputedStyle(hero), a = cs.getPropertyValue('--a').trim() || '#5b7cff', ink = cs.getPropertyValue('--i').trim() || '#fff';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, pw, ph);
    var rr = null; if (ripple && live) { var age = (performance.now() - ripple.t0) / 1000; if (age < 1.6) rr = { x: ripple.x, y: ripple.y, r: age * 760, k: 1 - age / 1.6 }; else ripple = null; }
    var m = current, PAL = ['#ff2e93', '#19d3a2', '#ffd23f', '#5aa9ff'];
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i], x = p.x, y = p.y;
      if (m !== 'editorial') {
        if (live && ptr.on) { var dx = x - ptr.x, dy = y - ptr.y, d = Math.hypot(dx, dy); if (d < 190 && d > 0) { var f = (1 - d / 190) * 26; x += dx / d * f; y += dy / d * f; } }
        if (rr) { var rx = x - rr.x, ry = y - rr.y, rd = Math.hypot(rx, ry), g = Math.exp(-Math.pow((rd - rr.r) / 70, 2)); if (rd > 0) { x += rx / rd * g * 46 * rr.k; y += ry / rd * g * 46 * rr.k; } }
      }
      if (m === 'board') { ctx.fillStyle = ink; ctx.globalAlpha = 0.16; ctx.fillRect(x - 1.5, y - 1.5, 3, 3); }
      else if (m === 'blueprint') { ctx.strokeStyle = ink; ctx.globalAlpha = 0.3; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); ctx.stroke(); }
      else if (m === 'night') { ctx.fillStyle = i % 9 === 0 ? a : ink; ctx.globalAlpha = clamp(0.25 + 0.55 * Math.sin(t * 1.4 + p.p) * 0.5 + 0.28, 0.1, 0.95); ctx.beginPath(); ctx.arc(x, y, p.s, 0, 6.283); ctx.fill(); }
      else if (m === 'letter') { ctx.fillStyle = a; ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.arc(x, y, 2, 0, 6.283); ctx.fill(); }
      else if (m === 'candy') { var yy = y + Math.sin(t * 0.8 + p.p) * 8; ctx.fillStyle = PAL[p.c]; ctx.globalAlpha = 0.9; ctx.strokeStyle = ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, yy, p.s, 0, 6.283); ctx.fill(); ctx.stroke(); }
      else if (m === 'siren') { ctx.strokeStyle = ink; ctx.globalAlpha = 0.22; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 7, y + 7); ctx.lineTo(x + 7, y - 7); ctx.stroke(); }
      else if (m === 'editorial') { ctx.strokeStyle = ink; ctx.globalAlpha = 0.09; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(pw, y + 0.5); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    if (force) fieldUntil = performance.now() + 4500;
    if (live && heroVisible && !fieldRaf && (((m === 'night' || m === 'candy') && performance.now() < fieldUntil) || ptr.on || rr)) fieldRaf = requestAnimationFrame(function () { fieldRaf = 0; drawField(false); });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { heroVisible = e.isIntersecting; if (heroVisible) drawField(false); }); }).observe(hero);
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        heroInBand = e.isIntersecting;
        if (heroInBand) claim('hero', current); else release('hero');
      });
    }, { rootMargin: '-40px 0px -92% 0px' }).observe(hero);
  }
  window.addEventListener('resize', function () { drawField(true); });
  render(); wear(K0.w, K0.v); status.innerHTML = 'This page is wearing <b>' + WORLDS[K0i].name + '</b>, design <b>' + K0.v + ' of 5</b>, ' + DESIGNS[K0.w][K0.v - 1].name + '. Throw the die and it changes.';
  chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-world') === current)); });
  claim('hero', K0.w);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { drawField(true); });
  drawField(true);

  /* ---------- before and after: a handle you can drag, and one small sweep to show it ---------- */
  var cmp = $('#cmp'), range = cmp && $('input', cmp);
  if (range) {
    var setP = function (v) { cmp.style.setProperty('--p', v + '%'); };
    var touched = false;
    range.addEventListener('input', function () { touched = true; setP(range.value); });
    ['pointerdown', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) { range.addEventListener(ev, function () { touched = true; }, { passive: true }); });
    if ('IntersectionObserver' in window) {
      var sio = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; sio.disconnect();
        if (!motionOn()) return;
        var t0 = performance.now(), D = 2600;
        (function step(now) {
          if (touched || !motionOn()) return;
          var s = clamp((now - t0) / D, 0, 1), v = 50 + Math.sin(s * Math.PI * 2) * 30 * (1 - s * 0.2);
          range.value = String(Math.round(v)); setP(v);
          if (s < 1) requestAnimationFrame(step); else { range.value = '50'; setP(50); }
        })(t0);
      }, { threshold: 0.6 });
      sio.observe(cmp);
    }
  }

  /* ---------- copy ---------- */
  var live = $('#copied');
  $$('.cp').forEach(function (b) {
    var label = b.textContent;
    b.addEventListener('click', function () {
      var txt = $('#' + b.getAttribute('data-copy')).textContent;
      var done = function (ok) {
        live.textContent = ok ? 'Copied to the clipboard.' : 'Copying was blocked here. Select the text and copy it by hand.';
        b.textContent = ok ? 'Copied' : 'Select and copy';
        setTimeout(function () { b.textContent = label; live.textContent = ''; }, 2000);
      };
      var fallback = function () { var ta = doc.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; doc.body.appendChild(ta); ta.select(); var ok = false; try { ok = doc.execCommand('copy'); } catch (x) {} doc.body.removeChild(ta); done(ok); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { done(true); }, fallback); else fallback();
    });
  });

  /* ---------- interfaces that live: the run console, running, with its own pause control ---------- */
  (function () {
    if (typeof KubikLive === 'undefined') return;
    var fig = $('#live-fig'), axEl = $('#ax'), feedEl = $('#feed'), box = $('#feedbox'), chip = $('#chip'), stat = $('#feed-status');
    if (!fig || !axEl || !feedEl) return;
    var st = KubikLive.init(), SPEED = 0.5, held = false, pending = 0, visible = false, last = 0, drawn = 0, W = 0;
    function laneW() { var l = $('.ax-lane', axEl); return l ? l.clientWidth : 0; }
    function paint() { W = laneW() || W; axEl.innerHTML = KubikLive.axis(st, W || 520); }
    function showFeed(fresh) { feedEl.innerHTML = KubikLive.feed(st.feed.slice(0, 6)); for (var i = 0; i < fresh; i++) { var li = feedEl.children[i]; if (li) li.classList.add('fresh'); } }
    function chipText() { chip.textContent = pending + ' new'; chip.hidden = !pending; }
    function flush() {
      if (!pending) return;
      var n = pending; pending = 0; chipText(); showFeed(Math.min(n, 3));
      stat.textContent = n + (n === 1 ? ' new run' : ' new runs') + ' added to the feed';
    }
    function hold(on) { held = on; if (!on) flush(); }
    box.addEventListener('mouseenter', function () { hold(true); });
    box.addEventListener('mouseleave', function () { if (!box.contains(doc.activeElement)) hold(false); });
    box.addEventListener('focusin', function () { hold(true); });
    box.addEventListener('focusout', function () { setTimeout(function () { if (!box.contains(doc.activeElement) && !box.matches(':hover')) hold(false); }, 0); });
    chip.addEventListener('click', function () { flush(); });
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { visible = es[0].isIntersecting; last = 0; }, { threshold: 0 }) : null;
    if (io) io.observe(axEl); else visible = true;
    if ('ResizeObserver' in window) new ResizeObserver(function () { var w = laneW(); if (w && Math.abs(w - W) > 1) paint(); }).observe(axEl);
    showFeed(0); paint();
    function frame(ts) {
      requestAnimationFrame(frame);
      if (!visible || fig.classList.contains('motion-off')) { last = 0; return; }
      if (!last) { last = ts; return; }
      var dt = Math.min(ts - last, 400) / 1000; last = ts;
      st.fresh = 0;
      KubikLive.step(st, dt * SPEED);
      if (st.fresh) {
        if (held) { pending += st.fresh; chipText(); }
        else showFeed(st.fresh);
      }
      if (ts - drawn > 110) { drawn = ts; paint(); }
    }
    requestAnimationFrame(frame);
  })();

  /* ---------- the gallery: you fall into a piece and climb back out ---------- */
  var tiles = $$('.tile'), dlg = $('#viewer'), vimg = $('#vw-img'), vt = $('#vw-title'), vm = $('#vw-meta');
  var f1b = $('#vw-f1'), f2b = $('#vw-f2'), cur = 0, frameNo = 1;
  tiles.forEach(function (li, i) {
    var b = doc.createElement('button'); b.type = 'button'; b.className = 'hit';
    b.setAttribute('aria-label', 'Open ' + li.getAttribute('data-name') + ': ' + li.getAttribute('data-meta'));
    b.addEventListener('click', function () { openPiece(i); });
    li.insertBefore(b, li.firstChild);
  });
  function fill() {
    var li = tiles[cur], imgs = $$('img', li);
    vt.textContent = li.getAttribute('data-name');
    vm.textContent = li.getAttribute('data-meta') + '. ' + li.getAttribute('data-desc') + ' ' + (li.getAttribute('data-note') || 'Sample content, in Russian.');
    f2b.hidden = f1b.hidden = !imgs[1]; if (!imgs[1]) frameNo = 1;
    var f = frameNo === 2 ? imgs[1] : imgs[0];
    vimg.src = f.src; vimg.alt = frameNo === 2 ? 'A later frame of ' + li.getAttribute('data-name') + '.' : imgs[0].alt;
    f1b.setAttribute('aria-pressed', String(frameNo === 1)); f2b.setAttribute('aria-pressed', String(frameNo === 2));
  }
  function openPiece(i) { cur = i; frameNo = 1; fill(); root.style.overflow = 'hidden'; dlg.showModal(); }
  function closePiece() {
    if (!dlg.open) return;
    dlg.close(); root.style.overflow = ''; var b = $('.hit', tiles[cur]); if (b) b.focus({ preventScroll: false });
  }
  function step(d) { cur = (cur + d + tiles.length) % tiles.length; frameNo = 1; fill(); }
  $('#vw-out').addEventListener('click', closePiece);
  $('#vw-prev').addEventListener('click', function () { step(-1); });
  $('#vw-next').addEventListener('click', function () { step(1); });
  f1b.addEventListener('click', function () { frameNo = 1; fill(); });
  f2b.addEventListener('click', function () { frameNo = 2; fill(); });
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); closePiece(); });
  dlg.addEventListener('click', function (e) { var c = e.target.classList; if (e.target === dlg || c.contains('vw') || c.contains('vw-frame')) closePiece(); });
  dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { step(1); } else if (e.key === 'ArrowLeft') { step(-1); } });
  dlg.addEventListener('close', function () { root.style.overflow = ''; });
})();

var SYS_PROOF = [];
var SYSTEMS = [{"name":"Fennel","blurb":"A dark system: graphite ground, one teal, a plain grotesque.","tokens":{"--color-ground":"#14161a","--color-surface":"#1b1e23","--color-raised":"#242830","--color-line":"#343944","--color-text-primary":"#eceef2","--color-text-secondary":"#a9b0bc","--color-action":"#4fd1b4","--color-action-ink":"#08201a","--color-ok":"#62c6a4","--color-warn":"#e9b44c","--color-bad":"#ff7f98","--color-info":"#86a8ff","--font-ui":"\"IBM Plex Sans\", \"IBM Plex Sans Fallback\", \"Helvetica Neue\", Arial, sans-serif","--font-data":"\"JetBrains Mono\", \"JetBrains Mono Fallback\", ui-monospace, Menlo, monospace","--text-xs":"0.75rem","--text-sm":"0.8125rem","--text-md":"0.9375rem","--text-lg":"1.125rem","--weight-regular":"400","--weight-strong":"600","--space-1":"4px","--space-2":"8px","--space-3":"12px","--space-4":"16px","--space-5":"24px","--space-6":"32px","--space-7":"48px","--space-8":"64px","--radius-1":"4px","--radius-2":"8px","--radius-pill":"999px","--shadow-popover":"0 8px 24px rgb(0 0 0 / 0.4)","--shadow-handle":"0 1px 2px rgb(0 0 0 / 0.5)","--row-compact":"24px","--row-regular":"32px","--control":"44px"},"colors":[["ground","--color-ground"],["surface","--color-surface"],["raised","--color-raised"],["line","--color-line"],["text-primary","--color-text-primary"],["text-secondary","--color-text-secondary"],["action","--color-action"],["action-ink","--color-action-ink"],["ok","--color-ok"],["warn","--color-warn"],["bad","--color-bad"],["info","--color-info"]]},{"name":"Juniper","blurb":"A light system: paper ground, one forest green, a serif for reading.","tokens":{"--color-ground":"#f4f6f2","--color-surface":"#ffffff","--color-raised":"#e8eee6","--color-line":"#c9d3c6","--color-text-primary":"#16201a","--color-text-secondary":"#46564a","--color-action":"#1d7447","--color-action-ink":"#ffffff","--color-ok":"#17713f","--color-warn":"#8a5600","--color-bad":"#b0233c","--color-info":"#1f55b3","--font-ui":"\"Newsreader\", \"Newsreader Fallback\", Georgia, \"Times New Roman\", serif","--font-data":"\"IBM Plex Sans\", \"IBM Plex Sans Fallback\", \"Helvetica Neue\", Arial, sans-serif","--text-xs":"0.8125rem","--text-sm":"0.875rem","--text-md":"1rem","--text-lg":"1.25rem","--weight-regular":"400","--weight-strong":"600","--space-1":"4px","--space-2":"8px","--space-3":"12px","--space-4":"16px","--space-5":"24px","--space-6":"32px","--space-7":"48px","--space-8":"64px","--radius-1":"6px","--radius-2":"12px","--radius-pill":"999px","--shadow-popover":"0 8px 24px rgb(22 32 26 / 0.16)","--shadow-handle":"0 1px 2px rgb(22 32 26 / 0.25)","--row-compact":"28px","--row-regular":"36px","--control":"44px"},"colors":[["ground","--color-ground"],["surface","--color-surface"],["raised","--color-raised"],["line","--color-line"],["text-primary","--color-text-primary"],["text-secondary","--color-text-secondary"],["action","--color-action"],["action-ink","--color-action-ink"],["ok","--color-ok"],["warn","--color-warn"],["bad","--color-bad"],["info","--color-info"]]},{"name":"Terra","blurb":"A warm system: brown-black ground, terracotta, a soft serif.","tokens":{"--color-ground":"#1c1410","--color-surface":"#271c16","--color-raised":"#34261d","--color-line":"#55402f","--color-text-primary":"#f6eadb","--color-text-secondary":"#cdb8a2","--color-action":"#e2793d","--color-action-ink":"#1c1410","--color-ok":"#a3c96f","--color-warn":"#f2bb52","--color-bad":"#ff8d7c","--color-info":"#93b8ea","--font-ui":"Fraunces, \"Fraunces Fallback\", Georgia, \"Times New Roman\", serif","--font-data":"\"JetBrains Mono\", \"JetBrains Mono Fallback\", ui-monospace, Menlo, monospace","--text-xs":"0.8125rem","--text-sm":"0.9375rem","--text-md":"1.0625rem","--text-lg":"1.25rem","--weight-regular":"400","--weight-strong":"600","--space-1":"4px","--space-2":"8px","--space-3":"12px","--space-4":"16px","--space-5":"24px","--space-6":"32px","--space-7":"48px","--space-8":"64px","--radius-1":"2px","--radius-2":"6px","--radius-pill":"999px","--shadow-popover":"0 10px 28px rgb(0 0 0 / 0.5)","--shadow-handle":"0 1px 2px rgb(0 0 0 / 0.6)","--row-compact":"24px","--row-regular":"32px","--control":"44px"},"colors":[["ground","--color-ground"],["surface","--color-surface"],["raised","--color-raised"],["line","--color-line"],["text-primary","--color-text-primary"],["text-secondary","--color-text-secondary"],["action","--color-action"],["action-ink","--color-action-ink"],["ok","--color-ok"],["warn","--color-warn"],["bad","--color-bad"],["info","--color-info"]]},{"name":"Argon","blurb":"A sharp system: black and white, one hazard yellow, square corners, hard shadows.","tokens":{"--color-ground":"#000000","--color-surface":"#0b0b0b","--color-raised":"#1c1c1c","--color-line":"#8a8a8a","--color-text-primary":"#ffffff","--color-text-secondary":"#d4d4d4","--color-action":"#ffe600","--color-action-ink":"#000000","--color-ok":"#2bf08a","--color-warn":"#ffb000","--color-bad":"#ff5c5c","--color-info":"#4cc9ff","--font-ui":"Archivo, \"Archivo Fallback\", \"Helvetica Neue\", Arial, sans-serif","--font-data":"\"JetBrains Mono\", \"JetBrains Mono Fallback\", ui-monospace, Menlo, monospace","--text-xs":"0.75rem","--text-sm":"0.8125rem","--text-md":"0.9375rem","--text-lg":"1.125rem","--weight-regular":"500","--weight-strong":"800","--space-1":"4px","--space-2":"8px","--space-3":"12px","--space-4":"16px","--space-5":"24px","--space-6":"32px","--space-7":"48px","--space-8":"64px","--radius-1":"0px","--radius-2":"0px","--radius-pill":"0px","--shadow-popover":"6px 6px 0 rgb(255 230 0 / 1)","--shadow-handle":"0 0 0 1px rgb(255 255 255 / 1)","--row-compact":"24px","--row-regular":"32px","--control":"44px"},"colors":[["ground","--color-ground"],["surface","--color-surface"],["raised","--color-raised"],["line","--color-line"],["text-primary","--color-text-primary"],["text-secondary","--color-text-secondary"],["action","--color-action"],["action-ink","--color-action-ink"],["ok","--color-ok"],["warn","--color-warn"],["bad","--color-bad"],["info","--color-info"]]},{"name":"Plume","blurb":"A soft system: lilac paper, big radii, one violet, round type.","tokens":{"--color-ground":"#ece8f8","--color-surface":"#f8f6ff","--color-raised":"#ddd6f2","--color-line":"#c7bde8","--color-text-primary":"#251d4f","--color-text-secondary":"#544a86","--color-action":"#4f30e0","--color-action-ink":"#ffffff","--color-ok":"#0f6546","--color-warn":"#775000","--color-bad":"#b02857","--color-info":"#2158c2","--font-ui":"\"Bricolage Grotesque\", \"Bricolage Grotesque Fallback\", \"Helvetica Neue\", Arial, sans-serif","--font-data":"\"JetBrains Mono\", \"JetBrains Mono Fallback\", ui-monospace, Menlo, monospace","--text-xs":"0.8125rem","--text-sm":"0.9375rem","--text-md":"1.0625rem","--text-lg":"1.25rem","--weight-regular":"400","--weight-strong":"700","--space-1":"4px","--space-2":"8px","--space-3":"12px","--space-4":"16px","--space-5":"24px","--space-6":"32px","--space-7":"48px","--space-8":"64px","--radius-1":"10px","--radius-2":"20px","--radius-pill":"999px","--shadow-popover":"0 14px 36px rgb(60 40 140 / 0.22)","--shadow-handle":"0 2px 6px rgb(60 40 140 / 0.25)","--row-compact":"28px","--row-regular":"40px","--control":"48px"},"colors":[["ground","--color-ground"],["surface","--color-surface"],["raised","--color-raised"],["line","--color-line"],["text-primary","--color-text-primary"],["text-secondary","--color-text-secondary"],["action","--color-action"],["action-ink","--color-action-ink"],["ok","--color-ok"],["warn","--color-warn"],["bad","--color-bad"],["info","--color-info"]]}];
/* "Inside your system": an engineering die. A throw is planned at its start and lands exactly, and draws a system and a
   product screen; the marked slot of the screen is where a component made by a kubik run goes. No entrance slides in. */
(function () {
  var doc = document, $ = function (s, c) { return (c || doc).querySelector(s); }, $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var appEl = $('#sys-stage'), stage = null; if (!appEl) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  function h(tag, cls, html) { var el = doc.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; }
  var RUNS = {}, waiting = {};   // product name -> [variant, variant, variant]; each variant is its own script, fetched when its face is first wanted
  window.kubikRun = function (p, n, o) { (RUNS[p] = RUNS[p] || [])[n - 1] = o; var cbs = waiting[p + n]; delete waiting[p + n]; (cbs || []).forEach(function (fn) { fn(true); }); };
  function runUrl(p, n) { return 'assets/runs/' + p.toLowerCase() + '-' + n + '.js'; }
  function loadRun(p, n, cb) {   // no fetch or XHR: a script element, so the page works from a folder on disk
    if (RUNS[p] && RUNS[p][n - 1]) { if (cb) cb(true); return; }
    var k = p + n; if (waiting[k]) { if (cb) waiting[k].push(cb); return; }
    waiting[k] = cb ? [cb] : [];
    var sc = doc.createElement('script'); sc.src = runUrl(p, n); sc.async = true;
    sc.onerror = function () { var cbs = waiting[k]; delete waiting[k]; (cbs || []).forEach(function (fn) { fn(false); }); };
    doc.head.appendChild(sc);
  }
  function warm(p, n) {   // the next likely face, asked of the network at a low priority once the page is idle
    if (RUNS[p] && RUNS[p][n - 1]) return;
    var go = function () { var l = doc.createElement('link'); l.rel = 'prefetch'; l.as = 'script'; l.href = runUrl(p, n); doc.head.appendChild(l); };
    if (window.requestIdleCallback) window.requestIdleCallback(go, { timeout: 4000 }); else window.setTimeout(go, 1500);
  }

  /* ===== the product screens: a whole page in each system's design, with one marked region ===== */
  var PRODUCTS = [
    { name: 'Rota', ask: 'a 24-hour coverage timeline with a selectable window', kind: 'a shift planner', lay: 'A', nav: ['Planner', 'People', 'Swaps', 'Reports', 'Settings'], title: 'Evening shift', crumb: 'Operations / Planner', tabs: ['Week', 'Day', 'Coverage'], ctx: ['Needs cover', ['Sam, 18:00 to 22:00', 'Priya, 06:00 to 10:00', 'Jo, night float']], side: ['Notes', ['Dock 2 is closed until Thursday.', 'Training moves to 15:00.']] },
    { name: 'Linden', ask: 'booking an appointment: a doctor, a day and a free slot', kind: 'a clinic schedule', lay: 'B', nav: ['Today', 'Patients', 'Rooms', 'Billing'], title: 'Tuesday clinic', crumb: 'Front desk', tabs: ['Day', 'Rooms'], ctx: ['Waiting', ['Okafor, 09:10, room 2', 'Lindqvist, 09:25', 'Haddad, 09:40, walk-in']], side: null },
    { name: 'Marrow', ask: 'an orders table with filters, selection and a bulk action with undo', kind: 'a shop back office', lay: 'C', nav: ['Orders', 'Stock', 'Customers', 'Discounts', 'Shipping'], title: 'Orders this week', crumb: 'Marrow Goods / Orders', tabs: ['Open', 'Packed', 'Returns'], ctx: ['Low stock', ['Linen apron, 4 left', 'Brass scoop, 2 left', 'Tea towel set, 6 left']], side: null },
    { name: 'Gantry', ask: 'a live view of running deploys with steps, logs, a failure and a retry', kind: 'a deploy console', lay: 'D', nav: ['Services', 'Deploys', 'Runbooks', 'Audit'], title: 'Production', crumb: 'Gantry / eu-west', tabs: ['Services', 'Queue'], ctx: ['Freeze window', ['Friday 16:00 to Monday 08:00']], side: ['Runbook', ['1. Pause the queue.', '2. Roll back one step.', '3. Tell the channel.']] },
    { name: 'Murmur', ask: 'a live queue of incoming tickets with an N new chip and triage', kind: 'a support inbox', lay: 'E', nav: ['Inbox', 'Mine', 'Unassigned', 'Closed'], title: 'Inbox', crumb: 'Murmur / Support', tabs: ['Open', 'Waiting'], ctx: ['Customer', ['Ana Reyes, since 2022', 'Plan: team, 8 seats', 'Last reply 2 days ago']], side: ['Saved replies', ['Reset a password', 'Change a plan', 'Refund policy']] }
  ];

  var tagEl = null;
  function buildApp(i) {
    var P = PRODUCTS[i], list = function (a) { return '<ul>' + a.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; };
    appEl.className = 'sys app lay-' + P.lay; appEl.setAttribute('role', 'group'); appEl.setAttribute('aria-label', P.name + ', ' + P.kind + '. The marked region is the new component.');
    appEl.innerHTML = '<div class="ap-nav" aria-hidden="true" inert><div class="ap-brand"><i aria-hidden="true"></i>' + P.name + '</div><div class="ap-links">' + P.nav.map(function (n, k) { return '<button type="button" class="ap-link"' + (k === 0 ? ' aria-current="page"' : '') + '>' + n + '</button>'; }).join('') + '</div></div>'
      + '<div class="ap-top" aria-hidden="true" inert><div><div class="ap-crumb">' + P.crumb + '</div><h4>' + P.title + '</h4></div><div class="ap-tabs">' + P.tabs.map(function (n, k) { return '<button type="button" class="ap-tab"' + (k === 0 ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + n + '</button>'; }).join('') + '</div><input class="ap-search" type="text" placeholder="Search" aria-label="Search ' + P.name + '"><span class="ap-av" aria-hidden="true">AK</span></div>'
      + '<div class="ap-ctx" aria-hidden="true" inert><h5>' + P.ctx[0] + '</h5>' + list(P.ctx[1]) + '</div>'
      + (P.side ? '<div class="ap-side" aria-hidden="true" inert><h5>' + P.side[0] + '</h5>' + list(P.side[1]) + '</div>' : '')
      + '<div class="ap-slot"><div class="ap-dm ap-dm-t" aria-hidden="true"><span class="ap-tag">thrown by kubik</span></div><div class="ap-dm ap-dm-l" aria-hidden="true"></div><div class="sys ap-in"></div></div>';
    stage = $('.ap-in', appEl); stage.setAttribute('role', 'region'); tagEl = $('.ap-tag', appEl);
  }
  function drawDims() {   // the marking appears where it stands: a fade, no wipe
    if (reduce.matches || !appEl.animate) return;
    $$('.ap-dm, .ap-tag', appEl).forEach(function (e) { e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600 }); });
  }

  /* ===== the system panel: five invented systems, swatches that recolour everything ===== */
  var sx0 = $('#sx'), strip = $('.sys-strip'), curSys = Math.floor(Math.random() * 5), cur = {}, CHEX = /^#[0-9a-f]{6}$/i;
  var hex2rgb = function (h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.slice(i, i + 2), 16) / 255; }); };
  var lum = function (h) { var r = hex2rgb(h).map(function (c) { return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }); return 0.2126 * r[0] + 0.7152 * r[1] + 0.0722 * r[2]; };
  var con = function (a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  function hsl2hex(hh, ss, ll) { var a = ss * Math.min(ll, 1 - ll), f = function (n) { var k = (n + hh / 30) % 12, c = ll - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return ('0' + Math.round(c * 255).toString(16)).slice(-2); }; return '#' + f(0) + f(8) + f(4); }
  function hexL(h) { var r = hex2rgb(h), mx = Math.max.apply(null, r), mn = Math.min.apply(null, r); return (mx + mn) / 2; }
  var BG = ['ground', 'surface', 'raised'], TXT = ['text-primary', 'text-secondary', 'action', 'ok', 'warn', 'bad', 'info'];
  var CV = function (role) { var f = SYSTEMS[curSys].colors.filter(function (c) { return c[0] === role; })[0]; return f ? cur[f[1]] : null; };
  function alternatives(role) {   // up to six values that keep every text role at 4.5:1 or more on its grounds
    var need = [];
    if (BG.indexOf(role) >= 0) TXT.forEach(function (t) { need.push([CV(t), 4.5]); });
    else if (role === 'line') need.push([CV('ground'), 1.25]);
    else { BG.forEach(function (b) { need.push([CV(b), 4.5]); }); if (role === 'action') need.push([CV('action-ink'), 4.5]); }
    var neutral = BG.indexOf(role) >= 0 || role === 'line', soft = role.indexOf('text') === 0, sat = neutral ? 0.16 : soft ? 0.22 : 0.72, base = hexL(CV(role)), out = [];
    [8, 40, 95, 150, 195, 250, 290, 330].forEach(function (hue) {
      var best = null, bd = 9;
      for (var l = 0.03; l < 0.98; l += 0.02) { var h = hsl2hex(hue, sat, l), ok = need.every(function (n) { return con(h, n[0]) >= n[1]; }); if (ok && Math.abs(l - base) < bd) { bd = Math.abs(l - base); best = h; } }
      if (best && best !== CV(role)) out.push(best);
    });
    return out.slice(0, 6);
  }
  var ROLE_LABEL = { 'text-primary': 'text', 'text-secondary': 'muted' };
  function renderStrip() {
    var S = SYSTEMS[curSys], chips = SYSTEMS.map(function (x, i) { return '<button type="button" class="st-chip" data-i="' + i + '" aria-pressed="' + (i === curSys) + '">' + x.name + '</button>'; }).join('');
    var sw = S.colors.filter(function (c) { return c[0] !== 'action-ink'; }).map(function (c) { var lab = ROLE_LABEL[c[0]] || c[0]; return '<li><button type="button" class="swb" data-v="' + c[1] + '" data-r="' + c[0] + '" aria-haspopup="listbox" aria-expanded="false" aria-label="' + lab + ', ' + cur[c[1]] + '. Choose another value"><i style="background:var(' + c[1] + ')"></i><span>' + lab + '</span></button></li>'; }).join('');
    var sp = [1, 2, 3, 4, 5, 6, 7, 8].map(function (k) { return '<i style="height:var(--space-' + k + ')"></i>'; }).join('');
    strip.innerHTML = '<div class="st-chips" role="group" aria-label="Systems">' + chips + '</div><h3 id="sys-t">' + S.name + '</h3><p class="cap">' + S.blurb + '</p>'
      + '<p class="cap st-hint">Press a colour to try others. Every interface and the die take the change at once.</p><ul class="sw">' + sw + '</ul><div class="sy"><div class="sp" role="img" aria-label="Eight space steps">' + sp + '</div><div class="ty"><span style="font-family:var(--font-ui);font-weight:var(--weight-strong)">' + S.tokens['--font-ui'].split(',')[0].replace(/"/g, '') + '</span><span style="font-family:var(--font-data)">' + S.tokens['--font-data'].split(',')[0].replace(/"/g, '') + '</span></div></div>'
      + '<div class="rd"><i style="border-radius:var(--radius-1)"></i><i style="border-radius:var(--radius-2)"></i><i style="border-radius:var(--radius-pill)"></i><i class="sh"></i></div><div class="st-foot"><button type="button" class="st-reset">Reset</button></div><div class="sw-pop" role="listbox" hidden></div>';
    $$('.st-chip', strip).forEach(function (b) { b.addEventListener('click', function () { var i = +b.getAttribute('data-i'); if (i !== curSys) { applySystem(i); statusEl.textContent = SYSTEMS[curSys].name + ', inside ' + PRODUCTS[curSys].name + ' (' + PRODUCTS[curSys].kind + '), variant ' + (shown % 3 + 1) + ' of 3.'; } }); });
    $('.st-reset', strip).addEventListener('click', function () { applySystem(curSys, true); });
    $$('.swb', strip).forEach(function (b) { b.addEventListener('click', function () { openPop(b); }); b.addEventListener('keydown', function (ev) { if (ev.key === 'ArrowDown') { ev.preventDefault(); openPop(b); } }); });
  }
  var popFor = null;
  function closePop(back) { var p = $('.sw-pop', strip); if (!p || p.hidden) return; p.hidden = true; if (popFor) { popFor.setAttribute('aria-expanded', 'false'); if (back) popFor.focus(); } popFor = null; }
  function openPop(b) {
    var p = $('.sw-pop', strip); if (popFor === b) { closePop(true); return; } closePop(false);
    var role = b.getAttribute('data-r'), v = b.getAttribute('data-v'), alts = alternatives(role);
    p.innerHTML = '<div class="pp-t">' + (ROLE_LABEL[role] || role) + ' (' + cur[v] + ')</div><div class="pp-g">' + (alts.length ? alts.map(function (h) { return '<button type="button" role="option" class="pp-o" data-h="' + h + '" aria-label="' + h + '" style="background:' + h + '"></button>'; }).join('') : '<span class="cap">No other value keeps the text readable.</span>') + '</div>';
    p.hidden = false; popFor = b; b.setAttribute('aria-expanded', 'true');
    var br = b.getBoundingClientRect(), sr = strip.getBoundingClientRect(); p.style.top = (br.bottom - sr.top + 6) + 'px'; p.style.left = Math.max(8, Math.min(br.left - sr.left, sr.width - 8 - 3 * 52 - 42)) + 'px';
    var opts = $$('.pp-o', p); if (opts[0]) opts[0].focus();
    opts.forEach(function (o, i) {
      o.addEventListener('click', function () { setToken(v, o.getAttribute('data-h')); b.setAttribute('aria-label', (ROLE_LABEL[role] || role) + ', ' + o.getAttribute('data-h') + '. Choose another value'); closePop(true); });
      o.addEventListener('keydown', function (ev) { var d = { ArrowRight: 1, ArrowDown: 3, ArrowLeft: -1, ArrowUp: -3 }[ev.key]; if (d) { ev.preventDefault(); var n = opts[clamp(i + d, 0, opts.length - 1)]; if (n) n.focus(); } });
    });
  }
  strip.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { ev.preventDefault(); closePop(true); } });
  doc.addEventListener('pointerdown', function (ev) { if (popFor && !strip.contains(ev.target)) closePop(false); });
  function setToken(v, h) { sx0.style.setProperty(v, h); cur[v] = h; if (v === '--color-ground') scheme(); }
  function scheme() { sx0.style.colorScheme = lum(cur['--color-ground']) < 0.35 ? 'dark' : 'light'; }
  function applySystem(i, keep, defer) {
    curSys = i; var T = SYSTEMS[i].tokens; cur = {};
    Object.keys(T).forEach(function (k) { sx0.style.setProperty(k, T[k]); cur[k] = T[k]; }); scheme();
    popFor = null; renderStrip(); buildApp(i); if (!defer && typeof shown === 'number' ) mount(shown, true);
    if (!reduce.matches && !keep) [strip, $('#sx-die'), appEl].forEach(function (e) { if (e && e.animate) e.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' }); });
  }

  /* ===== the engineering die ===== */
  
  var sx = $('#sx'), cube = $('.sx-cube'), hop = $('.sx-hop'), shadow = $('.sx-shadow'), scene = $('.sx-scene'), statusEl = $('#sys-status'), throwBtn = $('#sx-throw'), fbtn = $$('.sx-face-btn'), proof = $('#sys-proof');
  var FACE = [[0, 0, 1], [1, 0, 0], [0, -1, 0], [0, 1, 0], [-1, 0, 0], [0, 0, -1]], FACE_UP = [[1, 0, 0], [0, 0, 1], [1, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 0]], I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  function mmul(a, b) { var r = new Array(9); for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]; return r; }
  function mvec(m, v) { return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]; }
  function tr(m) { return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]; }
  function rot(x, y, z, a) { var l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l; var c = Math.cos(a), s = Math.sin(a), t = 1 - c; return [t * x * x + c, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, t * y * y + c, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, t * z * z + c]; }
  function css3(R) { return 'matrix3d(' + [R[0], R[3], R[6], 0, R[1], R[4], R[7], 0, R[2], R[5], R[8], 0, 0, 0, 0, 1].join(',') + ')'; }
  function topFace(R) { var b = 0, bz = -9; for (var f = 0; f < 6; f++) { var z = mvec(R, FACE[f])[2]; if (z > bz) { bz = z; b = f; } } return b; }
  function squareTo(R, f) { var n = mvec(R, FACE[f]), ax = [n[1], -n[0], 0], s = Math.hypot(ax[0], ax[1]); var Q = s < 1e-6 ? (n[2] > 0 ? I3 : rot(0, 1, 0, Math.PI)) : rot(ax[0] / s, ax[1] / s, 0, Math.atan2(s, n[2])); var R1 = mmul(Q, R), u = mvec(R1, FACE_UP[f]), phi = Math.atan2(u[1], u[0]); return mmul(rot(0, 0, 1, Math.round(phi / (Math.PI / 2)) * (Math.PI / 2) - phi), R1); }
  var FACE_UPV = [[0, -1, 0], [0, -1, 0], [0, 0, -1], [0, 0, 1], [0, -1, 0], [0, -1, 0]];   // each face's own up, in cube space
  function squareUp(R, f) { var n = mvec(R, FACE[f]), ax = [n[1], -n[0], 0], s = Math.hypot(ax[0], ax[1]); var Q = s < 1e-6 ? (n[2] > 0 ? I3 : rot(0, 1, 0, Math.PI)) : rot(ax[0] / s, ax[1] / s, 0, Math.atan2(s, n[2])); var R1 = mmul(Q, R), u = mvec(R1, FACE_UPV[f]), phi = Math.atan2(u[1], u[0]); return mmul(rot(0, 0, 1, -Math.PI / 2 - phi), R1); }
  function randUnit() { var z = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - z * z); return [r * Math.cos(a), r * Math.sin(a), z]; }
  var S0 = Math.floor(Math.random() * 6), R = squareUp(mmul(rot(0.3, 0.8, 0.2, 2.1), I3), S0), shown = S0, mode = 'idle', plan = null, hopY = 0, last = 0, raf = 0, visible = false, started = false, drag = null, cleanup = null;
  function render() { cube.style.transform = css3(R); hop.style.transform = 'translateY(' + hopY.toFixed(1) + 'px)'; var k = clamp(1 + hopY / 260, 0.55, 1.05); shadow.style.transform = 'translateX(-50%) scale(' + k.toFixed(3) + ')'; }
  function planTo(f, b, k, dur) {   // the whole tumble is decided now and arrives on the target orientation
    var T = squareUp(mmul(rot.apply(null, randUnit().concat([Math.random() * 6.283])), I3), f), D = mmul(T, tr(R)), c = clamp((D[0] + D[4] + D[8] - 1) / 2, -1, 1), th = Math.acos(c), sa = Math.sin(th), ax;
    if (th < 1e-5) { ax = [0, 0, 1]; th = 0; } else if (sa > 1e-4) ax = [(D[7] - D[5]) / (2 * sa), (D[2] - D[6]) / (2 * sa), (D[3] - D[1]) / (2 * sa)];
    else { var best = [1, 0, 0], bl = -1; for (var i = 0; i < 3; i++) { var v = [D[i] + (i === 0 ? 1 : 0), D[3 + i] + (i === 1 ? 1 : 0), D[6 + i] + (i === 2 ? 1 : 0)], l = Math.hypot(v[0], v[1], v[2]); if (l > bl) { bl = l; best = v; } } ax = [best[0] / bl, best[1] / bl, best[2] / bl]; }
    plan = { R0: R, T: T, a: ax, th: th, b: b, k: k, dur: dur, t: 0, f: f, hop: k ? 46 + Math.random() * 20 : 0 };
    mode = 'plan'; throwBtn.setAttribute('aria-busy', 'true'); loop();
  }
  function throwDie(b, k, dur) {
    if (mode === 'plan') return; started = true;
    var f; do { f = Math.floor(Math.random() * 6); } while (f === shown);
    var si; do { si = Math.floor(Math.random() * SYSTEMS.length); } while (si === curSys); applySystem(si, false, true); loadRun(PRODUCTS[si].name, f % VARIANTS + 1);
    if (reduce.matches) { R = squareUp(mmul(rot.apply(null, randUnit().concat([Math.random() * 6.283])), I3), f); render(); land(f); return; }
    planTo(f, b || randUnit(), k || 2 + Math.floor(Math.random() * 2), dur || 1.2 + Math.random() * 0.3);
  }
  function pick(f) { if (mode === 'plan') return; started = true; if (f === shown) return; loadRun(PRODUCTS[curSys].name, f % VARIANTS + 1); if (reduce.matches) { R = squareUp(R, f); render(); land(f); return; } planTo(f, randUnit(), 1, 0.9); }
  function frame(now) {
    raf = 0; var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (mode === 'plan') {
      plan.t = Math.min(1, plan.t + dt / plan.dur); var s = plan.t, e = 1 - Math.pow(1 - s, 4);
      R = mmul(mmul(rot(plan.a[0], plan.a[1], plan.a[2], plan.th * e), rot(plan.b[0], plan.b[1], plan.b[2], 6.283185307 * plan.k * e)), plan.R0);
      hopY = -plan.hop * Math.pow(1 - s, 2) * Math.abs(Math.sin(s * 3 * Math.PI));
      render(); if (s >= 1) { R = plan.T; hopY = 0; render(); var f = plan.f; plan = null; mode = 'idle'; throwBtn.removeAttribute('aria-busy'); land(f); } else loop();
    } else if (mode === 'idle' && !started && visible && !$('#sx-die').classList.contains('motion-off') && !reduce.matches) { R = mmul(rot(0, 1, 0, 0.32 * dt), R); render(); loop(); }
  }
  function loop() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) loop(); }, { threshold: 0.05 }).observe(sx); else visible = true;
  doc.addEventListener('kubik:motion', function () { loop(); });
  // pointer: drag to turn, flick to throw, tap to throw
  scene.addEventListener('pointerdown', function (ev) { if (ev.button > 0 || mode === 'plan') return; drag = { x: ev.clientX, y: ev.clientY, t0: performance.now(), moved: 0, s: [] }; mode = 'drag'; started = true; try { scene.setPointerCapture(ev.pointerId); } catch (x) {} });
  scene.addEventListener('pointermove', function (ev) { if (!drag) return; var dx = ev.clientX - drag.x, dy = ev.clientY - drag.y, d = Math.hypot(dx, dy); drag.x = ev.clientX; drag.y = ev.clientY; drag.moved += d; drag.s.push([performance.now(), dx, dy]); if (drag.s.length > 8) drag.s.shift(); if (d > 0 && !reduce.matches) { R = mmul(rot(-dy / d, dx / d, 0, d * 0.012), R); render(); } });
  function endDrag() {
    if (!drag) return; var d = drag; drag = null; mode = 'idle'; var now = performance.now(), sx_ = 0, sy = 0, t0 = now;
    d.s.forEach(function (s) { if (now - s[0] < 90) { sx_ += s[1]; sy += s[2]; if (s[0] < t0) t0 = s[0]; } });
    var el = Math.max(16, now - t0), vx = sx_ / el * 1000, vy = sy / el * 1000, sp = Math.hypot(vx, vy);
    if (d.moved < 7 && now - d.t0 < 450) { throwDie(); return; }
    if (sp > 260 && !reduce.matches) { throwDie([-vy / sp, vx / sp, (Math.random() - 0.5) * 0.3], clamp(Math.round(2 + sp / 1400), 2, 5), 1.2 + clamp(sp / 4000, 0, 0.3)); return; }
    var f = topFace(R); if (reduce.matches) { R = squareUp(R, f); render(); if (f !== shown) land(f); return; }
    planTo(f, [0, 1, 0], 0, 0.45);
  }
  scene.addEventListener('pointerup', endDrag); scene.addEventListener('pointercancel', endDrag);
  scene.addEventListener('keydown', function (ev) { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); throwDie(); } });
  throwBtn.addEventListener('click', function () { throwDie(); });
  fbtn.forEach(function (b, i) { b.addEventListener('click', function () { pick(i); }); });


  /* ===== landing: a throw decides the screen and the variant; the face's schematic dissolves into the slot in place ===== */
  var VARIANTS = 3;
  function embed(html, host) {   // a run's fragment: its root div with its style and script. Styles are scoped by the kc- prefix; each script runs once, in the place it has in the fragment
    var tpl = doc.createElement('template'); tpl.innerHTML = html;
    Array.prototype.slice.call(tpl.content.querySelectorAll('script')).forEach(function (old) { var n = doc.createElement('script'); Array.prototype.slice.call(old.attributes).forEach(function (a) { n.setAttribute(a.name, a.value); }); n.textContent = old.textContent; old.parentNode.replaceChild(n, old); });
    host.appendChild(tpl.content);
  }
  function slotName(f) { return PRODUCTS[curSys].ask + ', variant ' + (f % VARIANTS + 1) + ' of ' + VARIANTS; }
  function mount(f, done) {   // done runs once the component stands in the slot: at once, or when its script has arrived
    shown = f; var P = PRODUCTS[curSys], n = f % VARIANTS + 1, run = RUNS[P.name] && RUNS[P.name][n - 1];
    stage.className = 'sys ap-in'; stage.innerHTML = ''; stage.setAttribute('aria-label', 'Marked region: ' + slotName(f));
    if (tagEl) tagEl.textContent = 'thrown by kubik · variant ' + n + ' of ' + VARIANTS;
    fbtn.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === f)); });
    $$('.sx-face', cube).forEach(function (x, i) { x.classList.toggle('lit', i === f); });
    if (!run) {
      stage.innerHTML = '<p class="ap-wait" role="status">Loading the component…</p>';
      proof.innerHTML = '<span>The tokens-lint line of the variant shown goes here, as the kubik run printed it.</span><small>The component for this slot is asked of kubik: ' + P.ask + '.</small>';
      loadRun(P.name, n, function (ok) {
        if (shown !== f || PRODUCTS[curSys] !== P) return;
        if (ok) mount(f, done); else stage.innerHTML = '<p class="ap-wait" role="status">The component could not be loaded.</p>';
      });
      return;
    }
    embed(run.html, stage);
    proof.innerHTML = run.proof;
    warm(P.name, n % VARIANTS + 1);
    if (done) done();
  }
  function dissolve(f) {   // the component resolves from a blur where it stands while the face's schematic fades out: no travel
    if (reduce.matches || !stage.animate) return;
    var svg = $$('.sx-face svg', cube)[f];
    var kids = Array.prototype.slice.call(stage.children);
    kids.forEach(function (c) { c.animate([{ opacity: 0.2, filter: 'blur(14px)' }, { opacity: 1, filter: 'blur(0)' }], { duration: 800, easing: 'ease-out' }); });
    if (!svg) return;
    var g = h('div', 'ap-ghost'); g.appendChild(svg.cloneNode(true)); stage.appendChild(g); g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 800, easing: 'ease-out' }).onfinish = function () { g.remove(); };
  }
  function land(f) {
    (window.kubikAfterFonts || function (fn) { fn(); })(function () { drawDims(); mount(f, function () { dissolve(f); }); });
    statusEl.textContent = 'Variant ' + (f % VARIANTS + 1) + ' of ' + VARIANTS + ': ' + PRODUCTS[curSys].ask + ', in ' + SYSTEMS[curSys].name + ', inside ' + PRODUCTS[curSys].name + ' (' + PRODUCTS[curSys].kind + ').';
  }
  applySystem(curSys, true, true); statusEl.textContent = SYSTEMS[curSys].name + ', inside ' + PRODUCTS[curSys].name + ' (' + PRODUCTS[curSys].kind + '). Throw the die, or pick a face.';
  render();
  // the first component is fetched when the section comes near the screen, not with the page
  var mounted0 = false, first = function () { if (mounted0) return; mounted0 = true; mount(shown); };
  if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); first(); } }, { rootMargin: '900px 0px' }); io.observe(appEl); } else first();
  ['pointerdown', 'keydown'].forEach(function (t) { scene.addEventListener(t, first, { once: true, capture: true }); });
})();
