# The frame

A kind or a style hands you a studio: a character, materials, a way of moving. What you make in it is
yours. This file is the frame around the canvas: the few things the person on the other side of the
screen needs, whatever the page looks like. It says nothing about how a page should look.

**One rule governs all the others: repair the defect, keep the effect.** When something here fails,
the fix is never to delete what made the page alive. A glow that costs contrast gets a darker
backing under the text. A loop that has to run on gets its own small pause control (§7). A headline that overflows a
phone gets a smaller minimum size there, not a smaller size everywhere. A page that passes this file
by becoming plain has failed the skill that sent you here.

## 1. Build for the target you are in

Find out what you are building into first: the repository's framework and packages, or the brief's
delivery limits (one static file, an email, a sandbox with a content security policy).

- A style's stack is its default for an empty project. Elsewhere, translate: a component
  becomes a section of markup, utility classes become plain CSS with custom properties, a motion
  library becomes CSS animation, the Web Animations API, scroll-driven CSS or a CDN build of the
  same library.
- Load only what the target can load, and check after rendering that fonts arrived. A font that
  never loads is a different design. A typeface must cover the script the page is written in: a
  face without Cyrillic, set on Russian text, silently becomes the fallback. If a rolled or listed
  face lacks the script, take the nearest one that has it and say so. A display face sliced into
  many subsets (the CJK faces are) can cover the letters and still miss the space or punctuation
  of your script; the audit's font check tells you, and the answer is the same: another face.
- **Where the target cannot load images, make them.** Canvas, SVG, CSS, generative code: real
  illustration at the quality of the rest of the page, never an empty slot and never a page with no
  visuals because photographs were unavailable.
- Say in your report which of the style's instructions the target made impossible and what you did
  instead.

## 2. What the page claims is true

- Numbers, names, quotes, customers, logos and people come from the brief or the project. Nothing
  invented is presented as a fact. A component that needs such content and has none is replaced by
  one the real content can fill.
- Ornament is free. A sheet number, a grid reference, a decorative code strip can be invented, as
  long as a reader cannot take it for a fact about the product.
- A demo or animated mock shows something the product really does.
- A claim is scoped: an install command for one runtime does not sit under three runtime names.
- Typography follows the language the page is written in.

- **A model is a claim, like a figure.** A structure the material proposes (which service belongs
  to which component, what the new system is made of, who owns what) carries its author and its
  firmness the way a figure carries its source, and the mark sits on the drawing itself, not in a
  footnote: "by [X]'s mapping, not agreed with the platform owners" stands in the drawing's
  caption, and a box that exists only in that mapping is drawn as proposed (dashed, or labelled),
  never in the same line as what the authoritative source describes. When the authoritative source
  (the owner's glossary, the measured system, the knowledge base) and a page disagree about the
  structure, the drawing does not choose for them: it draws the authoritative structure as the
  ground and the page's mapping over it as a proposal, or the two side by side at one size. A
  drawing follows the truth of the structure, not the richness of the data: a model with numbers
  attached is not more true than one without, and a figure derived through a contested model says
  so beside the figure ("by [X]'s mapping"), not in the footer.
- **Remaking somebody's document**: a slip with one reading (a misspelled word, a doubled
  letter) is corrected and listed in the note; anything that could change a claim (a figure, a
  count, a term, a date) stays as written and is flagged where the reader will see it. A term is
  not glossed unless the person asked for it: a gloss is your addition. Material is merged only
  where it repeats, every figure and claim stays at least once, and each merge is listed. A
  verdict the source passes on its own side ("nothing to fix", "this is fine") travels only as a
  quotation, in a column or note that names its author, never in the page's own voice and never
  in a line the reader meets before the figures it comments on; it is listed in the note as
  carried over. How the material reached you (which file held what, what the brief called it) is
  the build's business and stays out of the page.

## 3. It can be read

- **Contrast is computed, by the audit on flat ground and by you everywhere else.** Text reaches
  4.5:1 against what is actually behind it, 3:1 from 24px up. Over a gradient, glass, an image or
  a canvas, give the text its own backing, scrim or shadow and measure against that: the audit
  reports those as "needs a human look", and the look is yours. Muted and accent-coloured text are checked on every surface they sit on.
- Nothing meant to be read is under 12px.
- Code and commands are never clipped: they wrap at separators, or scroll in a container that is
  focusable and labelled.
- Effects may touch the words only while they stay legible; text does not sit on top of other text.

- Text kept for screen readers alone is a 1px box clipped off screen (`position: absolute; width:
  1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap`): the audit knows
  that shape and does not read it as clipped text. Any other way of hiding it is.
- **Drawn marks behave like drawn marks.** Four defects come back in build after build, and each
  has one cause:
  - *A line that wobbles by accident.* A hand-drawn look (a turbulence filter, jittered points)
    is a decision with a visible hand: one amplitude, one stroke weight, ends that land exactly
    on the nodes they join. A small wobble on a thin line between glowing points does not read as
    a hand; it reads as a line that missed. Either the hand is plainly there, or the line is clean
    (a straight segment, or a curve from a real easing).
  - *An arrow that drifts.* An annotation joining two things is anchored to both: drawn in the
    same SVG as them, or positioned at runtime from their boxes. An arrow placed by absolute
    pixels is right at one width and wrong at every other; the audit's second width is where it
    shows, so look at it there.
  - *Words that leave their shape.* A badge, a sticker, a starburst, a pill takes its size from
    the words inside it (padding around the text, the shape drawn to fit), never the other way
    round. Text never crosses the edge of the shape that holds it; the audit warns when it does.
  - *One drawing in two layouts.* When a switch moves the same marks into another arrangement
    (services by domain, then by component), the marks are the same elements moved, never a
    second drawing swapped in: a reader follows a thing they were looking at to where it goes.
    Each layout is a view the audit can address (`--views`), both are looked at at both widths,
    the move itself stops under reduced motion and under a pause control where it loops, and the state in between
    is never where a screenshot or a keyboard lands.
  - *A mark that covers what it points at.* An annotation lies above the thing it annotates and
    beside its words, never across them; a drawn circle around a thing has that thing inside it
    at every width, or it is not drawn at that width.
  - *Labels that touch.* A drawn figure's labels are thinned by measured pixels at the width in
    front of you (a tick that would meet its neighbour is dropped, a label that would leave its
    lane moves inside it), never by a percentage that held at one width. Every figure keeps its
    first and last label and the one the reader came for; the audit finds text printed over text.
- A drawing with a `viewBox` scales its text with its width: a 14px label at 1440 is 6px on a phone.
  Below a tablet width the drawing gets a second form (its labels as text beside it, or a short
  table), or its text is sized in the page's units, not the drawing's.

## 4. It works at every width

- No sideways scroll on a phone; fix the cause (`min-width: 0` on grid and flex children).
- On the phone the navigation still reaches every destination: a menu, a scrollable row, a bottom
  bar. Never links hidden with nothing in their place.
- Anchors clear a sticky header (`scroll-padding-top`).
- A pinned, horizontal, hover-driven or pointer-driven set piece has a second form, designed and
  looked at, for touch, narrow screens and a page without script. The second form can be simpler;
  it cannot be broken or empty.
- A wide table that scrolls inside its container says so (a shadow edge or a caption) and keeps
  its first column fixed; four columns of nineteen with no sign of the rest is the empty form.
- Hover and pointer physics sit inside `@media (hover: hover) and (pointer: fine)`.
- Cards in a row share a height, or their text aligns across the row.
- A navigation that does not fit says so (a visible edge, a count, a menu); a fade marks only a
  list that really overflows, never one that fits. What stays is a nav that can be longer than
  the screen.
- A frame that holds a picture (a viewer, a lightbox) fits the picture whatever its orientation:
  the picture is scaled to the room that is left after the text and the controls, and the text
  never lies under or over it. `--press` opens one for the audit.
- Content behind an open modal (a `<dialog>` opened with `showModal()`, a shown element with
  `aria-modal="true"`, content made `inert`) is meant to be covered, and the covered-text check
  exempts it; the text inside the modal is still checked. What stays is a failure for text
  covered by an overlay that is not modal.

- The three usual causes of a page wider than a phone: a headline held together with a
  non-breaking space or `nowrap`; an element positioned off screen with no `overflow: clip` on an
  ancestor (a decorative layer, a visually hidden status line); `100vw` where the page has a
  scrollbar. Look for these first.

## 5. It works without a mouse

- `lang` on the root; `header`, `nav`, one `main`, `footer`; one `h1`; headings in order.
- A skip link is the first focusable element.
- Links navigate, buttons act; `aria-label` only on elements with a role.
- **Focus is visible on every interactive element**, at 3:1. Design it in the style's character:
  it is part of the look, not a browser default to suppress.
- Targets are at least 24 by 24 CSS pixels: that is the frame, and the audit fails below it. On a
  phone the main actions want 44; the audit warns when more than a third of the targets are
  smaller. Anything pressed often or by a thumb (the main actions, navigation, a form's buttons,
  a filter) reaches 44; what may stay smaller is a footer link, a tag or a mark inside a drawing
  that also has a larger way in, and the note names them.
- A native date input failed the focus check in every build that kept one: use a formatted text
  field, or a control of your own with a visible focus ring.
- A menu or overlay moves focus in, keeps it in, closes on Escape and returns focus (`<dialog>` and
  popover do most of it).
- Nothing is reachable only by hover.
- A status change (copied, failed) is announced through a `role="status"` region; buttons that do
  different things have different names.
- Decorative graphics are `aria-hidden`; a graphic that informs has `role="img"` and a label; a
  marquee's duplicate row is hidden from assistive technology.
- **A drawing that is operated is one composite widget.** The `svg` has a role and a label naming
  what it shows; its marks are one roving tab stop (one Tab into the drawing, arrows between
  marks, Escape out), never one stop per mark. A mark that exists twice (the same service in two
  drawings, a row of the old beside a row of the new) carries a label that says which one. Label
  size is measured in rendered pixels and stays at 12 or more at the widest layout. A drawing
  wider than its column has an overview that fits, moves by keyboard, and below a tablet width
  takes the second form of §3. What the pointer reveals (a selected mark, a lit thread) is also
  written into a `role="status"` line.
- A state shown by colour or shape also exists as text.

## 6. It answers the touch

How a piece behaves is part of what the reader needs, and it is designed like everything else.

- **A piece is operated the way its kind is.** A deck turns by arrow keys, by buttons on screen, by
  wheel or trackpad and by swipe. A gallery moves by drag, by arrows and by its buttons. A long
  page scrolls, and its navigation shows where you are. Whatever a reader of this kind of thing
  would try first, works.
- **Every control answers.** Anything that can be pressed says so before the press (a hover state
  where there is a pointer, a focus state always) and after it (pressed, busy, done, failed). A
  thing that looks pressable and is not, or is pressable and does not look it, is a defect.
- **A state change moves nothing.** Selecting a row, opening a panel, hover, focus, error, an "open"
  label: neither the element nor its neighbours change size or place. Colour, an inset shadow or an
  outline shows it; a border that adds width, a label that pushes the line, a marker that was not
  reserved do not. What stays is the change itself, stated loudly; `--press` warns when the pressed
  element or a sibling moved (a disclosure that pushes what follows it is the honest exception), that
  a re-render replaced the pressed element, and that focus fell to `body` (keyboard focus survives a
  re-render: what stays is the re-rendered control taking focus back).
- **The state is on screen.** Which slide of how many, which section, which tab is open, what is
  paused, what was copied.
- **Controls are found without a manual.** The buttons are visible, or a short hint names the keys
  once. A shortcut is never the only way to do something.
- **A demonstration yields to the reader at the first touch.** A sample that plays by itself (a
  sweeping slider, a bouncing handle) stops at the first press or key, not after the first move,
  so a press-and-drag never fights it.
- **What can be dragged does not select text**, and a focus ring follows the shape it marks (the
  die, the round button), not a box around its hit area.
- **One gesture has one meaning, and nothing is taken hostage.** A wheel that turns slides does not
  also scroll the page under them; where the content itself scrolls, the wheel belongs to the
  content. A gesture you take over has a cooldown, so one flick of a trackpad is one step, and it
  stands down in a reading mode and inside anything that scrolls. A page that takes the scroll
  over for a set piece gives it back under reduced motion.

The frame asks that the answer exists. What it looks like (how a button leans, how a row lights
under the pointer) is the style's, and it is one of the places a style shows its character.

## 7. Motion can be stopped

**Motion that starts by itself ends by itself within 5 seconds; motion that has to run on carries
its own small control.** The need is WCAG 2.2.2: a reader can stop what moves beside their text.
Entrances, reveals, an ambient field, a hero flourish run once or settle, and need no control.
An entrance shows where the thing is: a crossfade, a blur that resolves or a transform in place, or
nothing at all. A card or panel that slides or drops in from outside its place is the machine's
habit, not a motion.
What the concept needs to keep alive (a live figure, a ticker, a loop, a canvas loop, a video)
gets a button on or beside the moving thing: a pause / play glyph drawn in inline SVG in the
piece's style, quiet until hovered or focused and always visible, `aria-label` in the page's
language, `aria-pressed`, a target of 24px or more (44px on touch). It stops that element's motion
only; pausing on hover or focus is a welcome extra, never the substitute. What stays is motion the
reader can stop; what goes is a control nobody asked for in every header. A page where most of it
moves (an immersive scroll film) may still choose one global `.motion-toggle`; the skill no
longer asks for it. A deck keeps its pause in its control bar.

Unchanged: `prefers-reduced-motion: reduce` stops everything (loops, parallax, pins, marquees,
canvas), a hidden tab pauses, and the page is whole without script.

The controls and the theme switch are shared machinery: copy `scripts/page-runtime.js` into the
page's own script and give it the buttons its header names (`[data-motion-toggle]`, with
`aria-controls` naming the moving element or sitting inside a `[data-motion]` region; and
`[data-theme-switch]` where the piece ships two schemes). A press pauses every animation in that
region, sets `motion-off` on it and dispatches `kubik:motion` on it, so a frame loop of your own
(canvas, GSAP) scoped to the region listens there; the global form checks `window.kubikMotion.on`
or listens on `document`. Your stylesheet carries the one rule that stops CSS animation:
`.motion-off, .motion-off *, .motion-off *::before, .motion-off *::after { animation-play-state: paused !important; }`.
The runtime starts every region paused under reduced motion and keeps the theme the reader chose.
The buttons answer like the piece's other controls; the audit finds them by attribute and never by
their words. A pause written by hand instead of copied goes wrong in one of three ways (a label
the audit cannot read, a frame loop that never hears it, a theme forgotten on reload), so it is
copied. A deck copies `scripts/deck-runtime.js` instead, which carries the same two controls and
the stage; never both files.

Move as much as the style wants. One condition more: **the page is whole without script.** An
entrance effect's hidden start state is applied by script once it is ready, so a reader without
script, or with a library that failed to load, sees everything. The audit renders the page once
with script off and compares what is readable.

## 8. The theme is decided

Ship both colour schemes, or one on purpose. Either way set `color-scheme`, keep colours in custom
properties, and check contrast in each scheme you ship.

## 9. The document is complete

A title, a description, a viewport meta; images with `alt` and a reserved size. Every
`font-family` ends in a generic family (`serif`, `sans-serif`, `monospace`, `system-ui`) the page
still reads well in: a font fetched over the network is a wish, and offline or behind a proxy that
blocks the font host the browser draws the fallback. The audit says which faces arrived; the note
repeats it. A page that needs the network to draw (a CDN script, a hosted font) still shows its
content without it.

## 10. Look before you ship

A page nobody rendered is a draft.

1. **Lint first**: `node <kubik>/scripts/lint.mjs <file>` reads the file in a second, without a
   browser, and names what the audit would fail: structure, sizes written in the stylesheet, a
   endless motion with no control of its own, a deck without a wheel. Repair that before spending a browser run.
2. **Run the audit once, when the piece is built**: `node <kubik>/scripts/page-audit.mjs
   <url-or-file> --quick --out <dir>`, with `--out` a directory of its own
   (add `--views "#list,#record,#form"` when the piece has several screens behind one address:
   each is checked and photographed in the same run; add `--press "<selector>"`, repeated, for an
   overlay or a menu the piece opens, so what it opens is measured too). It
   takes screenshots at every width it renders, runs axe-core, walks the page with the Tab key, presses the motion
   controls, and prints two lists; open its screenshots and scroll through all of them as a
   stranger would. The quick run covers desktop and phone. The full run (drop `--quick`) adds the
   dark scheme, reduced motion, a tablet and the page with script off; it is the last run when the
   person asks for a full check or the piece is about to go public, and otherwise it waits to be
   asked for. A run is minutes the person waits, so the work is checked once, not after every
   change.
   - **FRAME**: PASS, FAIL and WARN lines for this file. Every FAIL is repaired. A WARN is repaired
     or explained; where the WARN's own line says the measurement hit a limit of the script, say
     that and not a design reason. Where axe says "needs a human look" (text over a gradient, glass,
     an image or a canvas), the contrast is yours to compute against the backing you gave the text.
   - **RICHNESS**: how much is on the page: gradients, shadows, blur, keyframes, canvas and SVG
     graphics, colours, the largest type size, what is moving, and how many hover, pressed and
     transition rules answer the touch. There is no pass mark. Read it
     against what your style asks for: a style built on atmosphere, scale or motion whose numbers
     sit near zero is not finished, however clean its FRAME.
3. **Run it once more after the fixes**, the same kind of run, and stop there. If FRAME went clean
   and RICHNESS went down, you removed instead of repairing: put it back and fix it properly.
4. **The last change is followed by a check, always.** A repair made after the last run is a guess,
   and a guessed repair has replaced a form control blind. If the runs are spent, either undo the
   change or open the note with the line "Unchecked: …" naming it. Never ship it silently.

**When a check cannot run, the check degrades and the piece does not.** The lint needs only Node;
the audit needs a Chromium browser the script can find (`CHROME_PATH` or `--chrome` name one it
did not). Without a browser, use a browser tool the session has (a Playwright or Chrome tool) to
look at the widths and press the controls yourself, against the FRAME list; only `page-audit`
makes the FRAME and RICHNESS lists, so the note says `Unchecked: browser audit, because …` and
what you looked at instead. Without that, look with your eyes at what you can and read the
lint's rules as the checklist. This holds for a deck and `deck-shots` as for a page. Never install
anything and never spend the work on the environment: build the piece, run what runs, and say
what did not.

**When the person asks for speed, the browser waits.** "Fast", "no check", "skip the audit", in
any words: run the lint only (a second, no browser), hand over, and open the note with
`Unchecked: browser audit, skipped for speed on request`. The waiver covers this hand-over; a
piece about to go public still gets its full run first, unless the person waives that too by name.

**Your report** (this list is the whole note; other files only add lines to it), in this order:

1. The first line, one of: `Unchecked: …` (a change after the last run, or the check skipped on
   request), `Not rendered: …` (no browser; what is therefore unverified), `Sample content: …`
   (the material was invented and marked), or the concept line when none of those applies.
2. The concept in one or two lines, and the two concepts you did not take, one line each.
3. The kind and the register; what the dice gave you and what you did with it.
4. One line for each wish you heard: settled, leaned, or set aside and why.
5. The last line of the lint, the last FRAME line and the RICHNESS lines you read against the
   style; the `response` line; for a deck, the `controls` line; the habits `words.md` §4 found and
   removed, in a line.
6. What you pushed after the first look, and what it cost; what the target made impossible.
7. When the full run did not happen, one line offering it and saying what it adds ("Say 'full
   check' and I run the dark scheme, reduced motion, a tablet and script off.").
