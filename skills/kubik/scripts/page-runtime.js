/* kubik page runtime: the two controls every piece owes its reader, with no opinion about their look.
 *
 * Copy this whole file into the page's own <script> (a published page may load no outside script).
 *
 * 1. The pause control. One button, class "motion-toggle", anywhere on the page:
 *      <button type="button" class="motion-toggle" aria-pressed="false">Пауза движения</button>
 *    Pressing it sets class "motion-off" on <html>, pauses every running CSS and Web animation,
 *    and tells frame loops to stop: a loop checks `window.kubikMotion.on` each frame, or listens
 *    for the "kubik:motion" event. Under the system's "reduce motion" setting the page starts
 *    paused, and everything pauses while the tab is hidden. The label is the page's own, in its own language; the audit finds the control by its
 *    class, not its words.
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
  var state = { on: !reduce, hidden: false };   // "on" is the reader's choice, "hidden" the tab's state
  window.kubikMotion = state;
  function applyMotion() {
    var off = !state.on || state.hidden;
    root.classList.toggle('motion-off', off);
    if (document.getAnimations) document.getAnimations().forEach(function (a) { if (off) a.pause(); else if (a.playState === 'paused') a.play(); });
    Array.prototype.forEach.call(document.querySelectorAll('.motion-toggle'), function (b) { b.setAttribute('aria-pressed', String(!state.on)); });
    try { document.dispatchEvent(new CustomEvent('kubik:motion', { detail: { on: !off } })); } catch (e) {}
  }
  document.addEventListener('visibilitychange', function () { state.hidden = document.hidden; applyMotion(); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.motion-toggle');
    if (!b) return;
    state.on = !state.on; applyMotion();
  });
  if (reduce) applyMotion();
  // an animation that starts later (a reveal, a build) is paused too while motion is off
  var mo = window.MutationObserver && new MutationObserver(function () { if ((!state.on || state.hidden) && document.getAnimations) document.getAnimations().forEach(function (a) { if (a.playState === 'running') a.pause(); }); });
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
