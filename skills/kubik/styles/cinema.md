# Cinema: a film in four acts

A landing page directed like a short film. A wide, cinematic opening; a dense second act; scroll
set pieces where the page itself performs; a loud ending. It exists to break the habits every
generated page has: a headline wrapped into six short lines, a bento with holes, labels like
"SECTION 01", invisible button text, the same left-right layout repeated to the footer. The answer
to those habits is not caution. It is direction.

**Read before any code, both required:** `method.md` (how to work here) and `frame.md` (the frame
every piece stands in).
The pins, pans and scrubbed reveals this style lives on are built as `page/scroll.md` says, so that
each has a plain form underneath.

## What makes it this style

- **Four acts.** After a navigation bar with some character: *the opening* (the hero), *the
  substance* (a dense grid or an interactive typographic piece), *the set piece* (scroll
  choreography), *the close* (a massive, high-contrast call to action and a plain footer).
- **A wide hero.** The H1 flows horizontally in a container of 64rem or more and holds two to
  three lines at desktop. Six short lines is the failure this style was made to end.
- **A gapless bento.** `grid-auto-flow: dense`, spans worked out so that no cell is empty.
- **Real scroll choreography.** GSAP with ScrollTrigger: pins, scrubs, stacks. The page moves.
- **Chapters.** Huge vertical space between acts (`py-32` to `py-48`), so each reads as a scene.
- **No meta-labels.** "SECTION 01", "QUESTION 05", "ABOUT US" never appear.

## The roll comes first

This style starts from a real throw of the dice, because left alone a model takes the first option on
every list. Run it, then direct the result.

```
bash <kubik>/scripts/roll.sh \
  hero="cinematic centre|artistic asymmetry|editorial split" \
  type="Satoshi|Cabinet Grotesk|Outfit|Geist|Sora|Bricolage Grotesque|Syne" \
  colour="midnight and electric blue|bone and oxblood|forest and brass|cobalt and cream|graphite and acid lime|plum and peach|sand and ultramarine|black, white and one neon|ink and hot coral|deep teal and gold" \
  atmosphere="deep radial blurs|grainy mesh gradient|shifting dark overlays|aurora bands|light leaks|glowing grid|film grain and vignette" \
  components:3="inline typography images|horizontal accordion|infinite marquee|carousel|sticky card stack|giant counter band|split reveal" \
  scroll:2="pinned split|image scale and fade|scrubbed text reveal|card stacking|horizontal pan|parallax depth"
```

A card the content cannot fill comes out of the pool before the throw, as `method.md` says: a
quote carousel needs real quotes, a partner marquee needs real names, a typeface has to load.

## The shelves

**Hero architectures.**
- *Cinematic centre*: text centred at great width, two contrasting buttons, a full-bleed visual
  behind or below under a dark radial wash.
- *Artistic asymmetry*: text offset left, a floating visual entering from the lower right and
  overlapping the text block's empty area.
- *Editorial split*: text left, visual right, enormous negative space.

Keep floating stamps, pill tags and raw statistics out of the hero. Buttons are legible: light text
on dark, dark text on light.

**Bento.** Three to five cards, each with intent: large imagery, dense type, a CSS or canvas
effect. Work out the columns, rows and spans before building and show that they interlock.

**Components.**
- *Inline typography images*: small pill-shaped visuals set inside a massive heading, between the
  words.
- *Horizontal accordion*: vertical slices that widen on hover or focus to feature one; every slice
  keeps its title and gist visible, and on touch they stack open.
- *Infinite marquee*: a continuous band of large type or real names.
- *Carousel*: overlapping portraits beside minimalist quotes, moved by subtle arrows, when real
  quotes exist.
- *Sticky card stack*, *giant counter band*, *split reveal*.

**Scroll choreography.** Use `@gsap/react` in React, the global build elsewhere.
- *Pinned split*: a title pins on the left while a gallery scrolls on the right.
- *Image scale and fade*: visuals enter at `scale(0.8)`, grow to 1, then darken and recede as they
  leave.
- *Scrubbed text reveal*: the words of a central paragraph light up one after another with the
  scroll, from dim to full.
- *Card stacking*: cards rise from the bottom and stack.
- *Horizontal pan*, *parallax depth*.

Every clickable card and visual reacts to the pointer: `scale(1.05)` inside an `overflow: hidden`
frame over 700ms with an ease-out.

**Atmosphere.** Never a flat, default ground. Deep radial blurs, grainy mesh gradients, shifting
dark overlays, aurora bands, light leaks, a glowing grid, film grain with a vignette.

**Visuals.** Match them to the mood and treat them so they are not stock: `grayscale`,
`mix-blend-mode: luminosity`, raised contrast, a colour wash. Where the target cannot load
photographs, make the visuals in code at the same ambition: generative canvas, layered SVG, shader-
like gradients.

**Guard.** `overflow-x: clip` on the root stops sideways scroll from off-screen animation without
breaking `position: sticky`.

## Before code: the plan

Write it in a few lines: what the dice gave you and what you made of it; the concept; that the page has
navigation and all four acts; the H1's container width and its line count at desktop; the bento's
span arithmetic; that no meta-label exists and every button is legible.

## Where this style goes wrong

- **Choreography with nothing underneath.** The pinned and scrubbed sections have a plain, designed
  form for phones, touch, reduced motion and a page where GSAP never loaded.
- **Text that performs at the reader's expense.** A scrubbed paragraph's dim state is still
  readable; text being read is not shrunk, faded out or covered; overlapping art crosses only empty
  space.
- **Hidden until hover.** An accordion's content is never reachable by mouse alone.
- **Chapters that are just gaps.** The space between acts carries atmosphere: a wash, a line, a
  transition.
