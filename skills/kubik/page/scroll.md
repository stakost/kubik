# Scroll patterns: skeletons that fail soft

Read this when the design uses a scroll reveal, a pinned stack or a horizontal pan. Every pattern
here is an enhancement: the section is a complete, readable vertical layout first, and the pattern
is switched on only where it can run well.

## The switch

One condition decides whether choreography runs: wide screen, fine pointer, no reduced-motion
preference, library loaded. Everything else gets the plain layout, which you design and look at.
Choreography here means what takes the scroll over: a pin, a pan, a stack. A line or a fill that
only follows the scroll position, with nothing pinned, may run on a phone too.

```js
// Vanilla, with the global GSAP build. In React, put the same body inside useGSAP() or an effect
// with gsap.context() and return its revert.
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  mm.add('(min-width: 960px) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    document.documentElement.classList.add('has-choreo');   // CSS for the pinned layout keys off this
    // ... create ScrollTriggers here ...
    return () => document.documentElement.classList.remove('has-choreo'); // matchMedia reverts the rest
  });
}
```

Layout that only makes sense while pinned (a horizontal track, full-viewport cards) is written under
`.has-choreo`. Without the class the same markup is an ordinary list or grid.

## Reveal on scroll

Prefer the platform. This moves an element that is already visible, needs no script, and does
nothing where it is unsupported:

```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal {
      animation: rise linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 60%;
    }
    @keyframes rise { from { transform: translateY(24px); } to { transform: none; } }
  }
}
```

If the design needs a fade as well, the hidden start state is set by script only after the observer
exists, so a page without script never hides anything:

```js
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { threshold: 0.2 });
document.querySelectorAll('.reveal').forEach((el) => { el.classList.add('pre'); io.observe(el); });
// .pre { opacity: 0; transform: translateY(24px); }  .pre.in { opacity: 1; transform: none; transition: opacity .6s, transform .6s; }
```

Never attach a `scroll` event listener for this.

## Sticky stack

Cards pin at the top and the next one covers them. Give each pinned viewport enough to look at: a
single short line alone on a pinned screen, five times over, is a long scroll with little in it.

```js
mm.add(CONDITION, () => {
  const sheets = gsap.utils.toArray('.stack-card');
  const last = sheets[sheets.length - 1];
  sheets.slice(0, -1).forEach((sheet, i) => {
    ScrollTrigger.create({
      trigger: sheet, start: 'top top',             // pin at the viewport top, not halfway
      endTrigger: last, end: 'top top',
      pin: true, pinSpacing: false,
    });
    // Dim the covered card with an overlay, and hide it once it is fully covered.
    // Fading the card itself lets the cards underneath show through the text.
    gsap.to(sheet.querySelector('.stack-dim'), {
      opacity: 0.6, ease: 'none',
      scrollTrigger: { trigger: sheets[i + 1], start: 'top bottom', end: 'top top', scrub: true,
        onLeave: () => gsap.set(sheet, { visibility: 'hidden' }),
        onEnterBack: () => gsap.set(sheet, { visibility: 'visible' }) },
    });
  });
});
```

Each card has an opaque background and a `.stack-dim` child (`position: absolute; inset: 0;
background: var(--ground); opacity: 0; pointer-events: none`). Without the class from the switch,
the cards are a normal vertical list with normal spacing.

## Horizontal pan

Vertical scroll moves a track sideways while the section is pinned.

```js
mm.add(CONDITION, () => {
  const wrap = document.querySelector('.pan'), track = wrap.querySelector('.pan-track');
  const distance = () => track.scrollWidth - window.innerWidth;
  gsap.to(track, {
    x: () => -distance(), ease: 'none',
    scrollTrigger: {
      trigger: wrap, start: 'top top',              // the pin starts when the section reaches the top
      end: () => '+=' + distance(),                 // scroll length equals the horizontal travel
      pin: true, scrub: 1, invalidateOnRefresh: true,
    },
  });
});
```

The track's wrapper clips with `overflow: clip`, not `hidden`: a hidden box still scrolls when
focus moves into it, and that shifts the track sideways against the transform. The clip and the
single-row `display: flex` apply only under `.has-choreo`. The fallback is the phone's vertical list of the same items, never a clipped row and
never a grid that leaves the last item alone on a line. Links inside the track must still be
reachable by keyboard: when an item receives focus, scroll the page to the position that shows it.

## Common failures

- The trigger fires at `top center` or `top 80%`, so the pin starts halfway through the section.
  Use `start: 'top top'`.
- The choreography runs on touch screens and under reduced motion because nothing gated it.
- The fallback was never looked at: a track left clipped, cards left at full viewport height.
- GSAP mixed with a second animation library on the same elements. One library per element tree.
