# Minimal: the editorial document

A page that behaves like a beautifully set document: warm paper, near-black ink, one serif with
real character, hairlines instead of boxes, and colour so rare that a single pastel tag is an event.
Minimal is not empty. With almost nothing on the page, every remaining thing has to be exquisite:
the cut of the serif, the rhythm of the whitespace, one drawn line that carries the whole idea.

**Read before any code, both required:** `method.md` (how to work here) and `frame.md` (the frame
every piece stands in).

## What makes it this style

- **Type does the work.** An editorial serif for display against a clean sans for reading, with
  extreme contrast of scale between them.
- **A warm monochrome ground.** Paper and ink; colour appears as a small washed-out accent, never
  as a section background.
- **Flat.** Hairlines, not shadows; no glow, no glass, no saturated gradient. Depth comes from
  paper, light and spacing.
- **Air.** Wide margins, a readable measure, generous vertical rhythm.

## The shelves

**Paper and ink.** Warm bone (`#F7F6F3`, `#FBFBFA`) with charcoal (`#111111`, `#2F3437`); cool
drafting paper with graphite; newsprint grey with true black; cream with sepia ink; an ink-dark page
with chalk text for a night edition. Hairlines near `#EAEAEA`. Secondary text is a warm grey dark
enough to read (`#6B6A67` on bone; anything paler fails on a warm canvas).

**Spot colour.** Washed pastels in pairs, a pale ground with its deep text: red `#FDEBEC` /
`#9F2F2D`, blue `#E1F3FE` / `#1F6C9F`, green `#EDF3EC` / `#346538`, yellow `#FBF3DB` / `#8A5C00`.
Or mix your own in that register: lilac, clay, sage, sky. One or two on a page.

**Serifs.** Newsreader, Instrument Serif, Playfair Display, Source Serif 4, Cormorant Garamond,
EB Garamond, Libre Caslon, DM Serif Display, Fraunces; Lyon, Tiempos or Canela when licensed. Set
tight (tracking `-0.02em` to `-0.04em`, line-height near 1.1). Italic is a gesture to use on
purpose.

**Sans and mono.** Geist, Switzer, IBM Plex Sans, Hanken Grotesk, Figtree, the system stack.
Geist Mono, JetBrains Mono, IBM Plex Mono for code, keys and metadata. Body in ink at 16 to 18px,
line-height 1.6.

**Devices.** An asymmetric bento of tonal blocks (one close tone on the ground, no border, padding 24 to 40px). A
contents list as navigation. Hanging numerals and ruled lists. Footnotes and marginalia. A drop
cap. A pull quote set huge. Pastel pill tags in small caps. `<kbd>` keys drawn as physical keys. A
quiet window frame (white bar, three grey dots) around real product material. Accordions that are
just lines with a `+`. A colophon. Oversized numerals as quiet ornament.

**Illustration and light.** A continuous ink line drawn by hand, with one offset shape in a single
pastel. Technical line drawings. A botanical or architectural engraving feel. Paper itself: a soft
radial light in the hero at three or four percent, a faint grain, a deckle edge. Photographs, when
supplied: desaturated and warm.

**Motion.** Invisible until noticed. Sections settle in with a short rise and a slow ease
(`cubic-bezier(0.16, 1, 0.3, 1)`, around 600ms); lists arrive in a cascade (80ms apart); an
underline draws itself; a number counts up once; the ink line draws on first view; a card's border
darkens on hover and a button presses to 0.98. One very slow drift of light behind the hero is
allowed. Nothing bounces.

**Compositions.** A title page. A letter to the reader. A manual with numbered figures. A table of
contents that is the hero. Index cards on a desk. A broadsheet front page.

## Throw the dice

```
node <kubik>/scripts/roll.mjs \
  paper="warm bone + charcoal|cool drafting paper + graphite|newsprint + true black|cream + sepia|ink-dark night edition" \
  serif="Newsreader|Instrument Serif|Playfair Display|Source Serif 4|Cormorant Garamond|EB Garamond|Libre Caslon|DM Serif Display" \
  spot="pale red|pale blue|pale green|pale yellow|lilac|clay|sage" \
  composition="title page|letter to the reader|manual with numbered figures|contents as hero|index cards|broadsheet" \
  device:2="hanging numerals|marginalia|drop cap|huge pull quote|kbd keys|window frame|contents list|oversized numerals|colophon" \
  gesture="one italic phrase|an ink line that draws itself|a single pastel shape|an engraving|a number that counts once|light across the paper"
```

## Where this style goes wrong

- **It turns into a wireframe.** Five sections in the same mould, grey on white, is not
  minimalism. Give the page a centre: one section set far larger, or handed the one illustration.
- **The grey is too pale** and the tags too small. Compute the contrast; nothing under 12px.
- **The serif is an afterthought.** Choose it first and let it set the tone of everything else.
- **It forgets the phone.** The measure, the margins and the navigation are designed there too.
