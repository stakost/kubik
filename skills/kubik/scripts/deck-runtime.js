/* kubik deck runtime: the machine of a slide deck, with no opinion about its look.
 *
 * Copy this whole file into the deck's own <script> (a published page may load no outside
 * script). It expects this markup, and nothing else:
 *
 *   <main id="main">                      the stage; every slide is a direct child
 *     <section class="slide" id="s1">     one slide; builds are elements with class "step"
 *       …  <aside class="notes">speaker notes, hidden on the stage, shown by N</aside>
 *     </section>
 *   </main>
 *   <nav class="controls" aria-label="Слайды">            the control bar; counted as chrome, not slide text
 *     <button type="button" data-act="prev" aria-label="Назад">←</button>
 *     <button type="button" data-act="next" aria-label="Вперёд">→</button>
 *     <span data-count aria-live="polite"></span>          "3 / 8"
 *     <button type="button" data-act="notes" aria-pressed="false">Заметки</button>
 *     <button type="button" data-act="overview" aria-pressed="false">Все слайды</button>
 *     <button type="button" data-act="full">Экран</button>
 *     <button type="button" class="motion-toggle" aria-pressed="false">Пауза движения</button>
 *     <i data-rail></i>                                    optional progress mark; its width is set in %
 *   </nav>
 *
 * It sets, on <html>: class "deck" (a stage) or "reading" (one column), by the window's width;
 *   "overview" while all slides are shown; "notes-on" while notes are open; "motion-off" after the
 *   pause button, under the system's "reduce motion" setting, and while the tab is hidden;
 *   data-theme from [data-theme-switch] buttons, remembered in localStorage. On the current slide:
 *   class "on". On a shown build: class "shown". A frame loop of the deck's own checks
 *   window.kubikMotion.on each frame or listens for the "kubik:motion" event on document.
 * A deck copies this file and not page-runtime.js: the two controls are the same here.
 * It keeps the slide number in the hash as #1, #2, … and opens a linked slide with its builds shown.
 * It turns the deck by arrow and page keys, Space, Home and End, by a typed number and Enter, by the
 *   wheel or trackpad (one slide per gesture, half a second's cooldown), by swipe, and by the buttons.
 *   N notes, O overview, F fullscreen, Escape closes; typing in a field is left alone.
 * The deck's stylesheet does the rest: how a slide looks, how `.deck .slide` hides and `.on` shows,
 *   how `.reading` stacks them, how `.overview` tiles them, what `.notes-on .notes` looks like, and
 *   what `.motion-off` stops. A deck is whole without this script: without it, every slide is in
 *   the document in order, which is the reading mode.
 */
(function () {
  'use strict';
  var root = document.documentElement;
  var main = document.getElementById('main') || document.querySelector('main');
  if (!main) return;
  var slides = Array.prototype.slice.call(main.querySelectorAll(':scope > .slide, :scope > section'));
  if (!slides.length) return;
  var N = slides.length, cur = 0;
  var STAGE_MIN = 900;                               // narrower than this: the reading mode
  var counter = document.querySelector('[data-count]');
  var rail = document.querySelector('[data-rail]');
  var motion = document.querySelector('.motion-toggle');
  var isDeck = function () { return window.innerWidth >= STAGE_MIN && window.innerHeight >= 500 && !window.matchMedia('print').matches; };
  var steps = function (s) { return Array.prototype.slice.call(s.querySelectorAll('.step')); };

  function fromHash() { var m = /^#(?:slide-)?(\d+)$/.exec(location.hash); return m ? Math.max(0, Math.min(N - 1, +m[1] - 1)) : null; }
  function showSteps(s, count) { steps(s).forEach(function (st, k) { st.classList.toggle('shown', k < count); }); }
  function sync() {
    var deck = isDeck();
    root.classList.toggle('deck', deck); root.classList.toggle('reading', !deck);
    slides.forEach(function (s, k) {
      s.classList.toggle('on', k === cur);
      if (deck && !root.classList.contains('overview')) { if (k !== cur) s.setAttribute('inert', ''); else s.removeAttribute('inert'); } else s.removeAttribute('inert');
      if (!deck) showSteps(s, steps(s).length);     // the reading mode shows every build
    });
    if (counter) counter.textContent = (cur + 1) + ' / ' + N;
    if (rail) rail.style.width = ((cur + 1) / N * 100) + '%';
    Array.prototype.forEach.call(document.querySelectorAll('[data-slide-link]'), function (a) { a.setAttribute('aria-current', String(+a.getAttribute('data-slide-link') === cur + 1)); });
  }
  function go(i, allBuilds) {
    cur = Math.max(0, Math.min(N - 1, i));
    showSteps(slides[cur], allBuilds ? steps(slides[cur]).length : 0);
    sync();
    if (isDeck()) { try { history.replaceState(null, '', '#' + (cur + 1)); } catch (e) {} }
    else { var el = slides[cur]; if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start' }); }
  }
  function next() { var s = slides[cur], shown = s.querySelectorAll('.step.shown').length; if (shown < steps(s).length) showSteps(s, shown + 1); else if (cur < N - 1) go(cur + 1, false); }
  function prev() { var s = slides[cur], shown = s.querySelectorAll('.step.shown').length; if (shown > 0 && isDeck()) showSteps(s, shown - 1); else if (cur > 0) go(cur - 1, true); }
  function setPressed(act, on) { Array.prototype.forEach.call(document.querySelectorAll('[data-act="' + act + '"]'), function (b) { b.setAttribute('aria-pressed', String(on)); }); }
  function toggleNotes(on) { on = on === undefined ? !root.classList.contains('notes-on') : on; root.classList.toggle('notes-on', on); setPressed('notes', on); }
  function toggleOverview(on) { on = on === undefined ? !root.classList.contains('overview') : on; root.classList.toggle('overview', on); setPressed('overview', on); sync(); }
  function fullscreen() { var el = document.documentElement; if (document.fullscreenElement) { document.exitFullscreen && document.exitFullscreen(); } else if (el.requestFullscreen) { el.requestFullscreen().catch(function () {}); } }

  // controls on screen
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-act]');
    if (!b) { var sl = root.classList.contains('overview') && e.target.closest && e.target.closest('main > .slide, main > section'); if (sl) { toggleOverview(false); go(slides.indexOf(sl), true); } return; }
    var act = b.getAttribute('data-act');
    if (act === 'next') next(); else if (act === 'prev') prev(); else if (act === 'notes') toggleNotes(); else if (act === 'overview') toggleOverview(); else if (act === 'full') fullscreen();
  });
  // theme: the same control as page-runtime.js
  var themeButtons = document.querySelectorAll('[data-theme-switch]');
  if (themeButtons.length) {
    var markTheme = function () { var cur = root.getAttribute('data-theme') || 'auto'; Array.prototype.forEach.call(themeButtons, function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-theme-switch') === cur)); }); };
    var savedTheme = null; try { savedTheme = localStorage.getItem('kubik-theme'); } catch (e) {}
    if (savedTheme === 'light' || savedTheme === 'dark') root.setAttribute('data-theme', savedTheme);
    markTheme();
    Array.prototype.forEach.call(themeButtons, function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-theme-switch');
        if (v === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', v);
        try { if (v === 'auto') localStorage.removeItem('kubik-theme'); else localStorage.setItem('kubik-theme', v); } catch (e) {}
        markTheme();
        try { document.dispatchEvent(new CustomEvent('kubik:theme', { detail: { theme: v } })); } catch (e) {}
      });
    });
  }
  // motion: the same control as page-runtime.js; "hidden" is the tab's state, "on" the reader's choice
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionState = { on: !reduce, hidden: false };
  window.kubikMotion = motionState;
  function applyMotion() {
    var off = !motionState.on || motionState.hidden;
    root.classList.toggle('motion-off', off);
    if (document.getAnimations) document.getAnimations().forEach(function (a) { if (off) a.pause(); else if (a.playState === 'paused') a.play(); });
    if (motion) motion.setAttribute('aria-pressed', String(!motionState.on));
    try { document.dispatchEvent(new CustomEvent('kubik:motion', { detail: { on: !off } })); } catch (e) {}
  }
  if (motion) motion.addEventListener('click', function () { motionState.on = !motionState.on; applyMotion(); });
  document.addEventListener('visibilitychange', function () { motionState.hidden = document.hidden; applyMotion(); });
  if (reduce) applyMotion();

  // keyboard
  var typed = '';
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    var k = e.key;
    if (k === 'Escape') { if (root.classList.contains('overview')) toggleOverview(false); else if (root.classList.contains('notes-on')) toggleNotes(false); return; }
    if (!isDeck()) return;
    if (/^[0-9]$/.test(k)) { typed = (typed + k).slice(-3); return; }
    if (k === 'Enter' && typed) { e.preventDefault(); go(+typed - 1, true); typed = ''; return; }
    typed = '';
    if (t && t.closest && t.closest('button, a, [role=button]') && (k === ' ' || k === 'Enter')) return;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); prev(); }
    else if (k === 'Home') { e.preventDefault(); go(0, false); }
    else if (k === 'End') { e.preventDefault(); go(N - 1, true); }
    else if (k === 'n' || k === 'N' || k === 'т' || k === 'Т') toggleNotes();
    else if (k === 'o' || k === 'O' || k === 'щ' || k === 'Щ') toggleOverview();
    else if (k === 'f' || k === 'F' || k === 'а' || k === 'А') fullscreen();
  });

  // wheel or trackpad: one slide per gesture; the cooldown swallows a trackpad's inertia
  var wheelAt = 0, wheelLast = 0, wheelSum = 0;
  document.addEventListener('wheel', function (e) {
    if (!isDeck() || root.classList.contains('overview') || e.ctrlKey) return;
    if (e.target.closest && e.target.closest('.notes, [data-scrolls]')) return;   // what scrolls on its own keeps the wheel
    e.preventDefault();
    var now = performance.now();
    if (now - wheelAt < 550) return;
    var d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    wheelSum = (now - wheelLast > 300 ? 0 : wheelSum) + d; wheelLast = now;
    if (Math.abs(wheelSum) < 40) return;
    wheelAt = now; if (wheelSum > 0) next(); else prev(); wheelSum = 0;
  }, { passive: false });

  // swipe, by touch and by pointer
  var x0 = null, y0 = null;
  function start(x, y) { x0 = x; y0 = y; }
  function end(x, y) { if (x0 === null || !isDeck()) { x0 = null; return; } var dx = x - x0, dy = y - y0; x0 = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev(); } }
  main.addEventListener('touchstart', function (e) { start(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  main.addEventListener('touchend', function (e) { end(e.changedTouches[0].clientX, e.changedTouches[0].clientY); }, { passive: true });
  main.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') start(e.clientX, e.clientY); });
  main.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') end(e.clientX, e.clientY); });

  window.addEventListener('hashchange', function () { var h = fromHash(); if (h !== null && h !== cur) go(h, true); });
  window.addEventListener('resize', sync);
  var h0 = fromHash();
  go(h0 === null ? 0 : h0, h0 !== null);           // a linked slide arrives with its builds shown
})();
