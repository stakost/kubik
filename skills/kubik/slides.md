# Slides: one idea at a time, on a stage

A deck is a performance with a room in front of it. Each slide holds one idea large enough to read
from the back, the sequence tells a story, and the look is a stage set: it has a world, and every
slide is a scene in it. It is not a document cut into rectangles, and it is not the same title-and-
bullets template in a new colour.

**Read before any code, both required:** `method.md` (how to work here) and `frame.md` (the frame
every piece stands in).

## What makes it a deck

- **The room first.** Write down who is watching, what they already know, and how long the talk
  is. That decides the vocabulary, the depth and the count.
- **One idea per slide, and the title says it.** "Review rounds feed on their own repairs", not
  "Review rounds". A slide that needs two titles is two slides.
- **A story, not an inventory.** The usual spine: the problem, what was tried, what came instead,
  how it works, what it gave. If how you got here is the point, the path comes early.
- **A budget.** About one slide per two and a half to three minutes: ten to twelve for half an
  hour. The first draft is always too many. Cut until each one earns its minute.
- **A fixed stage.** Slides are composed on a 16:9 canvas (1920 by 1080) and scaled to the
  window, so the composition is exactly what was designed. Body text is never under 28px on that
  canvas; titles start around 72px; only footers, eyebrows and captions go smaller.
- **A slide is looked at, not read.** If a slide takes more than about ten seconds to read, it is a
  page. Keep a slide to roughly forty words beyond its title (about 350 characters in all); what
  does not fit goes into that slide's speaker notes, where it belonged, in full. This holds for a
  source that must lose nothing: the deck grows in slides, never in words per slide, and the full
  wording lives in the notes (below, "A long source"). When the text will not shrink, the slide
  is two slides, or the talk is carrying too much.
- **One slide says the whole of its idea.** A build (a `.step` that appears on a press) is rare:
  only where the sequence is in the material itself (numbered steps, a diagram that grows part by
  part) and the speaker walks it; a bullet list revealed line by line is not a reason. Two slides
  that differ by one line are one slide, shown finished. When a deck is remade from a source that
  exported its animations as slides (the same slide, one more item each time), every such run
  becomes one slide and the note lists the merges; `deck-shots` names the runs it sees.
- **Made for people.** No internal codes or jargon on a slide; a term is explained where it
  stands; a figure from one case is called that; no claim that a careful listener could call
  dangerous or ambiguous; every number checked against its source.
- **Notes belong to the slide.** Speaker notes sit with each slide; the spoken outline, with a
  time per slide and the sentence that leads into the next one, is a separate file.
- **Real over mock.** A real screenshot, a real example, a real quote beats a drawn imitation.

## The machine

One self-contained HTML file, unless your environment offers a native slides format, in which case
build on that and bring this design into it.

- **The machine is shared; the look is yours.** Copy `scripts/deck-runtime.js` into the deck's own
  script and build the markup it names in its header: slides as `<section>` children of `main`,
  builds as `.step`, notes as `.notes`, a `.controls` bar with `data-act` buttons and the
  `.motion-toggle`. It does the keys, the wheel, the swipe, the hash, the builds, the overview, the
  notes, the reading mode, the pause and the theme switch; it is the deck's only runtime
  (`page-runtime.js` is for pages and is not copied beside it). A hand-written machine has gone
  wrong in most decks that tried; your stylesheet decides everything that shows. Write your own
  only when the deck needs a behaviour the runtime has not got, and then keep every behaviour
  below.
- Each slide is a `<section>`; the stage scales with CSS (`aspect-ratio: 16 / 9` and a `scale()`
  computed from the window).
- **Every way a person would try works.** Keys: arrows, Space and Page keys move; Home and End
  jump; a number and Enter goes to a slide; `N` shows notes; `O` opens an overview grid; `F` goes
  full screen where allowed. Wheel or trackpad: one slide per gesture, with a cooldown of about
  half a second so a trackpad's inertia does not run through the deck, and never while the
  overview, the notes or the reading mode is what scrolls. Buttons on screen: previous and next,
  named, visible or appearing when the pointer moves. Touch: a swipe moves one slide. The first
  slide says once, quietly, how to move. The control bar is drawn in the deck's world and answers
  like it: each button shows hover and press, the way paper lifts or a comic panel jumps.
- The slide number lives in the URL hash as `#1`, `#2`, and so on, so a link opens the right
  slide. (A deck that must use another pattern passes it to the slide script: `--hash "#slide-{n}"`.)
- Builds: elements marked as steps appear one press at a time, and all are visible in print, in
  the overview and on a slide opened straight from its link: whoever arrives by a link, a person or
  the script that photographs the slides, sees the finished slide, not its empty start.
- A progress mark, and a quiet footer with the section and the number.
- On a narrow screen the deck **reflows** into a reading mode: slides stacked in one column at
  body text size, notes under each. Shrinking the 16:9 stage to fit a phone turns 28px into 5px.
  The reading mode is also what a reader without script gets. Choose the mode from the window's
  width, never from the screen's: a window on a large monitor, an embedded viewer and a test
  browser all have a screen that says nothing about the space the deck has.
- `@media print`: one slide per page, steps shown, notes optional.
- Every figure in the deck comes from one data block at the top of the script, so a correction is
  made once.

## Looking at every slide

A deck is many pages, and each one is looked at. `frame.md`'s audit checks the page as a
whole; for the slides there is a second script beside it:

```
node <kubik>/scripts/deck-shots.mjs <url-or-file> --slides <n> --out <dir>
```

It photographs every slide through its hash link, and the phone's reading mode, and prints per
slide the typical text size on the 1920 canvas, how much text the slide holds, and anything that
runs off the stage. Then it tries the controls from the first slide (the right arrow, the wheel, a
next button, a swipe) and prints which of them moved the deck; one that did not is repaired. It
counts as slide text everything visible outside `nav`, `[role=toolbar]` and `.controls`, so the
control bar carries one of those, or it is measured as part of every slide. Open every picture. A slide it marks as too small for a room or as a lot to
read is rewritten, not defended.

## The shelves

**Worlds.** The working ones, for a room that decides or buys: a keynote black (huge type, one
light); a Swiss poster (grid, red, grotesque); a blueprint (ink ground, paper slides, one orange,
a faint drafting grid); a museum label (a large image and a small card of text); a magazine
spread; a night sky (dark, with points of coloured light). The ones an occasion invites, in the
roll only for an informal room (a team, a retro, a launch party) or when the person named them: a
chalkboard or a whiteboard with hand-drawn marks; cut paper, flat coloured shapes with soft
shadows; a terminal session; a comic with panels and speech balloons.

**Type.** A display face with presence: Archivo at a wide or condensed extreme, Bricolage
Grotesque, Unbounded, Syne, Anton, Fraunces, Playfair Display, Instrument Serif. A calm text face:
IBM Plex Sans, Public Sans, Geist, Figtree. A mono for eyebrows, footers and numbers. Two or three
sizes only, used consistently.

**Slide kinds.** A title that sets the world. A claim with its one piece of evidence. One giant
number and what it counts. A diagram built step by step. A timeline or an evolution. A comparison
of two things side by side. A quote at full size. A screenshot with callouts drawn on it. A section
divider that resets the room. A "how it works" sequence across three or four slides that keeps one
drawing and changes one thing each time. A closing slide that says the one sentence again.

**Drawing.** Slides are for showing. Diagrams from blocks and connectors that arrive in the order
you speak them. Annotations as if drawn by hand: a rough circle around the number, an arrow with a
wobble, underlines that are not quite straight (an SVG turbulence filter or jittered paths do it).
A line that draws itself across a chart. A highlight that moves from part to part. A zoom into one
region of a picture. Simple characters or objects where a metaphor helps.

**Devices.** A mono eyebrow naming the section. A footer with section and number. A progress rail.
A recurring object that travels through the deck and changes. Colour used only to point. A
blackout slide before the important one.

**Motion.** Between slides: a cut, a short fade with a small rise, a slide along the story's
direction, or a morph of the shared element (the View Transitions API where supported). Within a
slide: builds, drawing lines, a count-up, a pulse on the thing you are talking about. Everything
stops under reduced motion, where builds become instant.

## Throw the dice

```
bash <kubik>/scripts/roll.sh \
  world="blueprint|keynote black|Swiss poster|chalkboard|whiteboard sketch|cut paper|magazine spread|museum label|terminal session|comic panels|night sky" \
  display="Archivo wide|Archivo condensed|Bricolage Grotesque|Unbounded|Syne|Anton|Fraunces|Playfair Display|Instrument Serif" \
  accent="orange|vermilion|acid yellow|cobalt|emerald|magenta|chalk white on colour" \
  opening="one sentence, enormous|a question|a single number|a drawing that builds|an object alone on the stage" \
  drawing:2="hand-drawn annotations|diagram built in steps|a line that draws itself|a travelling highlight|zoom into a detail|a recurring object that changes|characters and metaphor" \
  transition="hard cut|fade with a small rise|slide along the story|morph of the shared element"
```

Before the command runs, take out of `display=` every face that does not cover the script the
deck is written in.

## A long source

A document that must lose nothing (thirty screens of a proposal, a contract walked through) does
not become eight slides. It becomes as many slides as it has ideas, each still looked at and not
read, with the full wording in that slide's speaker notes, where the reader who wants every word
finds it. The size of the file follows the source; the amount on a slide does not.

## Where a deck goes wrong

- **A document in rectangles**: paragraphs, six bullets, a table nobody can read from a chair.
  The commonest failure by far: the designer knows too much and puts it all on the slide.
- **Too many slides.** If the talk is thirty minutes and the deck is thirty slides, it is a
  reading, not a talk.
- **A title that names instead of claims.**
- **The inside view**: codes, internal names, "as we all know". A history of how it used to be,
  told to people who never knew.
- **A template with a palette swap**: every slide the same layout. Vary the kinds; keep the world.
- **The same slide six times, one line more each.** The speaker turns the page and nothing
  happens; the room reads ahead. A source's exported builds are merged, not carried.
- **Motion as decoration**: a transition that means nothing, a build that reveals nothing.
- **Numbers from memory.** Check each one; one wrong figure on a slide costs the whole talk.

## Before you call it done

- Every title is a claim; every slide is under its budget or its words are in its notes.
- `deck-shots` photographed every slide and the reading mode; its `controls` line names all four
  ways of turning as working.
- Every figure traces to the data block, and the data block to a source.
- The room is named at the top of the notes file, and the deck fits its minutes.
