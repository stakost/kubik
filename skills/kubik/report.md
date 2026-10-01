# A report: the answer, then the evidence

A report is a page someone opens because they need to decide or understand something, usually
quickly and usually on their own. It is designed like a good piece of editorial: the answer at the
top where it cannot be missed, the evidence laid out so it can be checked, and a visual character
that makes a busy person want to keep reading. It is not a wall of tables and it is not a slide
deck flattened into a page.

**Read before any code, both required:** `method.md` (how to work here) and `frame.md` (the frame
every piece stands in).

## What makes it a report

- **A named reader.** Before anything else, write who opens this and what they will do after
  reading. Their vocabulary, not yours: no internal codes, ticket numbers or tool jargon without a
  plain-language name beside them; explain a term where it first stands.
- **The answer is the headline.** The `h1` states the finding, not the topic: "Two of the three
  candidates can replace the current one", not "Candidate evaluation". Directly under it, the
  decision asked of the reader, if there is one.
- **A verdict row.** Three to five findings, one each, readable in ten seconds without scrolling.
- **Evidence follows, in a checkable order**: how it was measured, what was found, what the limits
  are, what comes next. Limits are in a visible box, not a footnote.
- **Every figure has a source**, listed at the end or beside the figure. A number from a single
  case is called that. A figure you could not verify is marked as unverified, never rounded into
  confidence. A figure you derived yourself (a sum, a ratio) shows its arithmetic and is named as
  yours. Counters in different units never add up to one score or one index: show them side by
  side, and rank only by a measure the reader would accept as one.
- **A recommendation is yours, and says so.** When the reader has a decision to make, recommend:
  a report that lists options and stops has left the work undone. Put the recommendation beside
  the decision, mark it as the author's judgement, give its reason in a line, and keep it visibly
  apart from what was measured. Never let it read as a finding. When one decision settles the
  others, it comes first, whatever order the questions arrived in.
- **Findings are prose or lists.** Tables are for data with columns; a finding with its reason and
  its consequence does not fit a cell.
- **It travels.** One self-contained, responsive file that reads well on a phone and prints
  cleanly (`@media print`: no sticky chrome, no dark ground, one column).
- **Shorter than the material.** The reader's attention is the scarce thing. What did not change
  the answer goes to an appendix or out.

## The shelves

**Worlds.** The working ones, for a report somebody decides from and sends on: a field report
(technical sans with a mono for labels, cool paper, one blue); an annual report (big confident
numerals, generous colour blocks); an engineering memo in the Swiss manner; a dossier (cover
sheet, tabs, stamps). The ones an occasion invites, in the roll only when the occasion is
informal or the person named them: a broadsheet front page; a lab notebook with ruled margins
and ink annotations; an atlas, every section opening with a plate; a zine, for a retrospective
with some attitude.

**Type.** A reading face with character: IBM Plex Sans, Source Serif 4, Newsreader, Literata,
Spectral, Public Sans, Inter Tight, Figtree, Instrument Sans. A display companion if the world
wants one: Fraunces, Playfair Display, Archivo at a wide setting, Bricolage Grotesque. A mono for
eyebrows, table heads and figures: IBM Plex Mono, JetBrains Mono, Geist Mono. Numerals are
tabular wherever they line up.

**Devices.**
- Verdict tiles, each with a coloured edge and one sentence; grade pills; a traffic-light strip
  with words beside the colours.
- A figure set huge with its label and its source.
- A pull finding: the single most important sentence at display size.
- Margin notes and footnoted sources; an eyebrow with the date and the scope.
- A caveat box that looks like one.
- A "what we asked, what we found" pair; a decision box with the options and the recommendation.
- A timeline or an evolution strip; a before-and-after only when the reader knew the before. Where
  the material has no history, the strip runs along an axis the material itself measures (a
  size, a count, a date of another kind), never along an invented past and never along a score
  you made to order it; where it measures none, the card is set aside.
- An appendix that folds (`<details>`).

**Charts and diagrams.** Drawn in SVG or canvas, labelled directly on the marks instead of through
a legend, one message per chart stated in its title ("Review rounds fell by half", not "Review
rounds"). Small multiples over one crowded chart. Sparklines in table rows. Bars before pies.
Diagrams from real blocks and connectors, annotated like a hand went over them. If a chart skill is
available in your environment, use it for the craft.

An annotated chart has a second form for the phone. A drawing scaled down by its `viewBox` takes
its labels with it, and a 14px label becomes a 6px one. Below a tablet width, show a simpler
drawing with the annotations as text beside it, or the same figures as a short table.

**Tables.** Short, with a caption, right-aligned tabular numerals, the key column emphasised, the
row that matters highlighted. A wide table scrolls inside its own focusable container.

**Motion.** Almost none, and only in the service of reading: a chart draws once, a figure counts up
once, sections settle in. Nothing loops. Response is not motion: every link, tab and fold answers
the pointer and the press in the world's own manner (a tab that shifts, a rule that thickens), as
the frame asks.

**Compositions.** A cover and a summary spread. A single long scroll with a sticky contents rail.
A two-column broadsheet. Cards of findings that open into detail.

## Throw the dice

```
bash <kubik>/scripts/roll.sh \
  world="field report|broadsheet front page|lab notebook|annual report|dossier|Swiss engineering memo|atlas with plates|zine" \
  reading="IBM Plex Sans|Source Serif 4|Newsreader|Literata|Spectral|Public Sans|Inter Tight|Figtree|Instrument Sans" \
  ground="cool paper|warm paper|white with one colour block|ink-dark with chalk|white with tinted bands of the accent" \
  accent="signal blue|vermilion|forest green|ochre|magenta|teal|violet" \
  verdict="tiles with a coloured edge|one huge figure per finding|a pull finding and three notes|a graded strip" \
  device:2="margin notes|huge figures|annotated diagram|small multiples|sparkline rows|evolution strip|decision box|folding appendix"
```

Before the command runs, take out of `reading=` every face that does not cover the script the
report is written in, and out of `device:2=` every card the material cannot fill.

## Where a report goes wrong

- **The topic as headline**, and the answer on page three.
- **Everything that was found, at equal weight.** Choose; an appendix holds the rest.
- **The author's vocabulary.** Codes, abbreviations and the names of internal tools.
- **A comparison the reader has no use for**: "was 32, now 24" means nothing to someone who never
  knew 32.
- **A number nobody re-checked.** Trace each one back to its source before it ships.
- **Decoration shaped like data**: a chart with no message, a gauge for one number.
- **A desktop-only file**: the reader opens it on a phone between meetings.

## Before you call it done

- The `h1` is the answer; the decision asked of the reader stands under it; the recommendation is
  marked as yours and sits apart from what was measured.
- Every figure traces to a source on the page, and every derived one shows its arithmetic.
- The verdict row reads in ten seconds on a phone; the limits are in a box the eye meets.
- Printed, it is one column with no sticky chrome; the appendix folds.
