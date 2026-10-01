# A page: read the room, then make something

For landing pages, portfolios, editorial pages and redesigns of them. This kind has no house
style. It reads the brief, sets three dials for how far to go, rolls the dice for whatever the brief
leaves open, and then asks you for a design with a point of view. Its enemy is the default: the
page that gets made when nobody decided anything.

**Not for** dashboards, admin panels, data tables, multi-step forms, code editors or native mobile.
Say so, and send them where they belong: numbers made for a reader go to `figures.md`, software
people operate goes to `system.md` (or to an existing component library, `page/libraries.md`).
Keep this file for the marketing surfaces around them.

**Read before any code, both required:** `method.md` (how to work here) and `frame.md` (the frame
every piece stands in).

In `page/`, each for its moment: `page/shelf.md` (devices to choose from), `page/scroll.md` (pins, pans
and reveals that fail soft), `page/libraries.md` (the brief points at an existing design system),
`page/redesign.md` (a site already exists), `page/habits.md` (what machine-made pages keep doing).

## 1. Read the brief

**Signals:** the kind of page; the words the user used for the mood; references they linked or
named; who will look at it; brand assets that exist; quiet constraints (accessibility-first, public
sector, regulated, children) that outrank aesthetics.

**Say the read in one line before any code:**

> My read: a *kind of page* for *whom*, in a *mood* register, closest to *which family of looks
> or which design system*.

If the read truly forks and the person is there to answer, ask **one** question ("closer to calm and precise, or loud and
experimental?"). If the context answers it, do not ask.

**Know the defaults so you can leave them**: a centred hero over a dark mesh; a purple-to-blue
gradient; three equal feature cards; glass on everything; one neutral sans on grey with a single
green accent, pill buttons, a tile grid and a band of statistics. None is forbidden. Each has to be
a decision.

## 2. Set the three dials

| Dial | 1 | 10 | Start at |
|---|---|---|---|
| `nerve` | perfect symmetry | composed chaos | 7 |
| `motion` | still | cinematic | 6 |
| `density` | gallery, airy | cockpit, packed | 4 |

The user's words move the dials, in conversation. State the three values with the read.

| What you heard | nerve | motion | density |
|---|---|---|---|
| nothing beyond "a landing page for the product" | 7 | 6 | 4 |
| calm, clean, quiet, a long read (the quiet register) | 4-6 | 2-3 | 2-3 |
| expensive, a brand people buy with their eyes | 7-8 | 5-7 | 2-4 |
| loud, strange, "a page people send to each other" | 9-10 | 8-10 | 2-3 |
| trust first: a bank, a public service, anything regulated | 3-4 | 2-3 | 4-5 |
| a studio's or a designer's own portfolio | 8 | 7 | 3 |
| an engineer's portfolio | 6 | 5 | 4 |
| a redesign that keeps the brand | as found | one step up | as found |
| a redesign with a new look | two steps up | two steps up | as found |

**The dials say how far you go, not whether you try.**

- **nerve 1-3**: symmetric grids, equal padding, centred. The character comes from type,
  proportion and one distinctive component. **4-7**: offsets and overlaps, mixed aspect ratios,
  left-aligned headers over centred data. **8-10**: uneven grids, type that breaks the grid, great
  fields of empty space used as composition.
- **motion 1-3**: hover and press states only, done beautifully. **4-7**: fluid CSS, a load-in
  cascade, scroll reveals, living details, physics on the actions. **8-10**: scroll choreography,
  parallax, pinned and horizontal set pieces, kinetic type, pointer physics.
- **density 1-3**: huge gaps between sections, everything expensive and clean. **4-7**: ordinary
  product spacing. **8-10**: tight, no card boxes, hairlines between data, a mono face for every
  number.

At motion 5 and above the page really moves. At 8 and above, motion is part of the idea. Above
nerve 3, every uneven layout still becomes one designed column on a phone.

## 3. The shelves

**Colour families.** A neutral base and one accent is the usual skeleton; what matters is which.
Cold luxury (silver, chrome, smoke). Forest (deep green, bone, amber). Black and tan. Cobalt and
cream. Terracotta and slate. Olive, brick and paper. Monochrome with one saturated pop (electric
blue, emerald, hot pink, signal orange). Ink and acid. Dusk (indigo into peach). Candy on white.
A brand's own colour always wins. Purple-blue glow and beige with brass are where everyone already
went; take them only with a reason.

**Type.** A sans with character for display: Geist, Outfit, Satoshi, Cabinet Grotesk, Sora,
Bricolage Grotesque, Syne, Archivo at an extreme width, Unbounded, Instrument Sans, Familjen
Grotesk; a licensed face when the project has one. Inter when the read is neutral, public-sector or
accessibility-first. A serif when the brief is truly editorial, luxury or heritage and you can say
why this one: Newsreader, Playfair Display, Cormorant Garamond, EB Garamond, Fraunces. A mono for
data: Geist Mono, JetBrains Mono, IBM Plex Mono. Emphasis inside a headline stays in the family
(italic or weight); display italics with descenders need a line-height of 1.1 or more.

**Heroes.** An uneven split. A manifesto in type alone. Moving type as the picture. A canvas or
media behind a mask of letters. A hero that stays pinned while the page begins. One object in
space. A full-bleed generative field. `page/shelf.md` has the rest: navigation, grids, cards, scroll,
galleries, type effects, small interactions.

**Atmosphere.** Grain on a fixed layer. Mesh and aurora gradients. A radial light. Tinted
shadows. Glass with a lit edge. Halftone or dither. Drafting lines. A paper or fabric texture.
Choose what the concept's world is made of.

**Visuals.** The page needs them; a page of text alone is unfinished. Real product material first:
a true screenshot, the working component, the real command, a diagram of the real mechanism drawn
with care. Then supplied photography; then generated imagery when a tool exists. Where the target
can load none of these, make the visuals in code (canvas, SVG, CSS) at the ambition of an
illustration.

**Motion tools.** Entry cascades. Scroll reveals. Living details (a pulse, a typewriter, a float,
a shimmer, a carousel) on the things that are alive. Magnetic buttons and tilt. A marquee. Sticky
stacks, horizontal pans, pinned splits (`page/scroll.md`). Spring easing
(`cubic-bezier(0.16, 1, 0.3, 1)` or a real spring), never `linear`. What starts by itself and runs on past 5 seconds follows `frame.md` §7.

## 4. Throw the dice

For whatever the brief and the brand leave open. Skip any card the brief already decides. The
motion cards are the whole `living` group and the devices that move by themselves or take over the
scroll (sticky stack, horizontal pan, marquee, scrambling text, two halves scrolling apart). With
`motion` at 3 or below, leave `living` out of the command; a moving device you are dealt is set
aside or taken in its still form (a route that is drawn, not one that draws itself).

```
bash <kubik>/scripts/roll.sh \
  colour="cold luxury|forest, bone and amber|black and tan|cobalt and cream|terracotta and slate|olive, brick and paper|monochrome with electric blue|monochrome with signal orange|ink and acid|dusk, indigo into peach|candy on white" \
  type="Geist|Outfit|Sora|Bricolage Grotesque|Syne|Archivo at an extreme width|Unbounded|Instrument Sans|Familjen Grotesk" \
  hero="uneven split|manifesto in type|moving type|canvas or media behind letters|pinned hero|one object in space|full-bleed generative field" \
  atmosphere="grain|mesh or aurora gradient|radial light|glass with a lit edge|halftone or dither|drafting lines|paper texture" \
  device:2="tile grid with living tiles|sticky stack|horizontal pan|marquee|cards with a spotlight edge|tilt cards|a path drawn by the scroll|scrambling text|text on a circle|two halves scrolling apart|a line that draws itself" \
  living="pulse on the key node|typewriter line|floating object|shimmer|drawing line|counting numbers"
```

## 5. What experience says about landing pages

Craft notes. Each is a habit that fails in a known way; break one on purpose, saying which and
what you get for it, never by accident.

- **The hero fits the first screen**: a headline of two lines at desktop, a sub-line of about 20
  words, the main action visible, a real visual. It says what the thing is. A four-line headline
  pushes the visual and the action below the fold, and the first screen says nothing.
- **Navigation on one line**, 64 to 80px tall: taller eats the hero, a second line reads as a
  menu that broke.
- **A kind of layout appears once.** Eight sections want at least four kinds; no more than two
  picture-and-text splits in a row.
- **Small labels set apart from the text are rationed**, uppercase or not: at most one per three
  sections. A label that names a real thing in a diagram is part of the diagram, not one of these.
- **A tile grid has exactly as many tiles as there is content**, with rhythm, and its tiles
  differ: two or three carry a picture, a gradient, a pattern or a living detail. Six white tiles
  of text is the dull default.
- **Long lists change form, not length**: grouped columns, a card grid, tabs, pills that scroll.
- **One accent, one neutral family, one corner-radius rule, one theme** per page, held everywhere.
- **A card only when elevation means something**; shadows tinted toward the ground.
- **One label per intent**: not "Get in touch" here and "Contact us" there. Button labels fit on
  one line.
- **Every string is re-read** before shipping; rewrite what is broken, cute, vague or said twice.
- **Whole interaction cycles** where the page has them: loading, empty, error, pressed.

## 6. Foundation

The target decides the stack. With no project around it, a page is one self-contained HTML file:
its own stylesheet and script inline, fonts from a font service with a system fallback in every
`font-family`, a library only from a CDN the target allows. Inside a project that has a stack
(`package.json`, a framework, a component library), the page is built in that stack: a framework
page with Tailwind where Tailwind is there, the Motion library or GSAP for scroll set pieces
where they are installed, interactive pieces as small client components; check `package.json`
before importing. If the brief reads as an existing design system, use its official package
(`page/libraries.md`). Icons from one library, one stroke width; where packages cannot load,
inline the same set's paths.

When a site already exists, read `page/redesign.md` first and name the mode: keep the brand, or a new
look.

## 7. Before you call it done

- The read, the dials, the throw and the concept are stated, and the page is recognisably that
  concept, not a default.
- There is a signature moment, and you can point at it.
- The dials match what the page does: the motion it claims is on screen.
- The craft notes you broke, you broke on purpose.
- The frame's audit was run: FRAME repaired, RICHNESS read against the dials.
