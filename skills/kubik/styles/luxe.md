# Luxe: depth, light and weight

The finish of a very expensive agency build. Surfaces that look machined, as if a glass plate had
been set into an aluminium tray. Light that comes from somewhere. Type with nerve. Space used
lavishly. Motion with mass, so that things settle instead of arriving. A visitor should want to
touch it.

**Read before any code, both required:** `method.md` (how to work here) and `frame.md` (the frame
every piece stands in).

## What makes it this style

- **Material depth.** Nothing sits flat on the background. Objects have an edge, a highlight, a
  shadow, a thickness.
- **Light.** The page has light sources: a glow behind the hero, a sheen on an edge, a gradient
  that reads as illumination rather than decoration.
- **Confident scale and lavish space.** Large, tight display type and room around it.
- **Weight in motion.** Custom easing that simulates mass and spring, never `linear` or the
  default ease; nothing changes state instantly.
- **Island chrome.** Navigation and primary actions float as pills detached from the edges.

## The shelves

**Vibes.** Pick one world and commit.

- *Night glass*: deepest near-black (`#050505`), radial mesh light in the background, dark cards
  with heavy backdrop blur and white hairlines at 10%, a wide geometric grotesque.
- *Paper and serif*: warm cream, sage or espresso, a high-contrast variable serif set enormous, a
  film-grain overlay for a physical paper feel.
- *White architecture*: white or silver-grey, massive bold grotesque, floating components on
  unbelievably soft, wide ambient shadows.
- Or another in the same league: liquid chrome and smoke; a night aurora; porcelain and ink;
  brushed titanium with one warm lamp; deep-sea blue with bioluminescent accents.

**Light and colour.** Choose where the light comes from and what colour it is: violet and emerald,
amber and rose, ice blue and white, a single gold lamp, a sunrise gradient. Let it fall on things:
glow behind objects, tinted shadows, a gradient across the display type, a spotlight that follows
the cursor, a rim light on the card edge.

**Type.** Geist, Plus Jakarta Sans, Outfit, Manrope, Sora, Instrument Sans; Clash Display, Satoshi
or PP Editorial New when the project can load them. For paper and serif, a face with drama:
Newsreader, Cormorant Garamond, Playfair Display, Fraunces. Not Inter, Roboto or Arial as the
voice. Display sizes are large and tight; a word in the headline may carry the light.

**Haptic details.**
- *The tray*: an outer shell (faint fill, hairline ring, small padding, large radius such
  as 2rem) around an inner core with its own fill, an inset top highlight and a concentric radius
  (`calc(outer - padding)`), like a glass plate set into a metal tray. Use it on cards, panels,
  inputs and feature tiles.
- *Islands*: primary buttons are full pills with generous padding; a trailing arrow lives in its
  own circle flush with the pill's inner edge.
- *Eyebrows*: a small pill above a heading, uppercase with wide tracking (12px).
- Inner highlights, 1px light borders, grain on a fixed layer, glass with refraction edges,
  squircle radii, soft coloured shadows under floating objects, reflections.

**Layouts.** An asymmetrical bento of different card sizes. A Z-axis cascade: cards stacked and
overlapping, a degree or two of rotation, depth of field. An editorial split: huge type on one
half, interactive cards or pills on the other. A single hero object floating in space. A long
cinematic scroll of full-bleed moments.

**Motion.**
- Easing such as `cubic-bezier(0.32, 0.72, 0, 1)`; 600 to 900ms for entrances.
- Entrances rise and come into focus: a lift of 40 to 60px with a blur that clears, applied by
  script so the page is whole without it.
- The floating nav pill; a hamburger whose lines rotate into an X; a full-screen glass overlay
  whose links rise in one after another.
- Magnetic buttons: the pill presses to 0.98, the inner icon circle drifts up and right and grows.
- Parallax between layers; a card that tilts toward the cursor; a border that lights up under it.
- Living details: a slow pulse on the key node, light that drifts, an object that floats.

**Space.** Section padding on the scale of `py-24` to `py-40`. Let it breathe; then check that the
breath reads as luxury and not as a gap where something failed to load.

## Throw the dice

```
node <kubik>/scripts/roll.mjs \
  vibe="night glass|paper and serif|white architecture|liquid chrome and smoke|night aurora|porcelain and ink|brushed titanium with one lamp|deep sea, bioluminescent" \
  light="violet and emerald|amber and rose|ice blue and white|one gold lamp|sunrise gradient|magenta and cyan|moonlight silver" \
  layout="asymmetrical bento|Z-axis cascade|editorial split|single floating hero object|cinematic full-bleed scroll" \
  type="Geist|Plus Jakarta Sans|Outfit|Manrope|Sora|Instrument Sans|a dramatic serif for display" \
  detail:2="trays everywhere|spotlight borders|glass with refraction edges|tilt toward cursor|gradient light across the headline|floating object with coloured shadow|grain over everything" \
  motion="blur-to-focus entrances|magnetic buttons|layered parallax|staggered mask reveal|drifting light|spring-settle cascade"
```

## Where this style goes wrong

- **Dim text.** Muted copy on a near-black ground needs white at 55% or more; on cream, black at
  55% or more. The glow goes behind the object, the words sit on something solid.
- **Space that reads as broken.** A band of nothing taller than the viewport is a hole. Put light,
  a floating object or a transition in it.
- **Depth applied by rote.** The tray is a material, not a border style; vary what sits inside it
  and let the most important object be the most physical.
- **Desktop-only luxury.** On the phone the pill, the overlay menu and the cards are designed
  again: no rotation or overlap that swallows touch targets, and the menu handles focus.
- **Effects instead of an idea.** Glass and glow are the materials, not the concept.
