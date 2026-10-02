# Figures: the numbers a room runs on

A dashboard, a KPI summary, a quarterly review, a board pack: a page where people come for numbers
and leave with a decision. Corporate readers like their charts, their pies and their big figures,
and they are right to: a good one is read in a second. What they are tired of is the same grey
template with a logo on it. This is the page that has the figures they expect and a look nobody
expected.

**Read before any code, both required:** `method.md` (how to work here) and `frame.md` (the frame
every piece stands in).

## What makes it this kind

- **One figure leads.** The number the reader came for is the largest thing on the page, with its
  unit, its period and what it is compared to.
- **Every chart says one thing, in its title.** "Costs fell by a fifth", not "Costs". The chart
  below proves the sentence above it.
- **The numbers are the content, and they are exact.** Nothing is rounded differently in two
  places, every total adds up on the page, and a reader can reach the table behind any picture.
- **It is corporate in its manners, not in its face.** Calm, legible, serious about units and
  sources. The world it lives in is still chosen, not defaulted.

## The numbers

- **One data block.** Every figure on the page comes from one object at the top of the script (or
  one table in the markup). A correction is made once. Nothing is typed twice.
- **Only what the material holds.** No invented history, no trend from two points, no target nobody
  set. A figure you derive (a share, a delta, a sum) shows its arithmetic and is named as derived.
- **No index of unlike things.** Four counters in four units do not add up to one score; show them
  side by side, or use a composite the material itself defines. A ranking needs a measure the
  reader would accept as one.
- **Two measures in different units are compared in one unit, or through a named bridge.** When
  the two sides count different things (a service on one, a component on the other), the unit
  stands under every figure; then either both sides are restated in a unit they can share, or the
  conversion is drawn as its own step: a waterfall whose first bar changes the unit and whose next
  bars are the difference. A number that follows from a rule of the model rather than from a
  measurement (a zero that is true by definition) is not a headline: it sits beside the measured
  figures with the words "by rule", never in the first row of tiles. The same for a figure that
  follows from one author's mapping of the structure rather than from the structure the
  authoritative source describes: it carries "by [X]'s mapping" beside the number, and the page's
  headline is a figure that holds under both readings (`frame.md` §2, "A model is a claim"). Two different quantities that
  happen to share a value are not set side by side without a word between them. Where two
  readings of one word give two numbers (pairs that changed together twice in the whole sample, or
  once in the selection), both definitions are printed beside the figures.
- **A number never travels alone**: unit, period, and a comparison (previous period, plan, the
  other option). A delta says what it is a delta from.
- **Period and source are on the page**, once, where a reader looks for them.
- **Empty, late and partial data have a face**: "no data for March" is drawn, not skipped.

## For a board

A board, a management committee, an investor: readers who have ten minutes, read many such pages,
and must leave with a decision. For them the page is strict and plain before it is anything else.
Unless the person asks otherwise, the register is quiet or balanced, never loud, and the order is
fixed:

1. **The verdict, in one line**: on plan, behind plan, ahead, and by how much. It is the page's
   headline, not a sentence under a title: "The quarter closed 14 below plan", never "Report for
   the third quarter". Then what is asked of the board, numbered, before any chart.
2. **The few figures that carry the verdict**, each against the plan and against the period
   before. A number without its plan is half a number here. The status beside it says whether
   that is good or bad, not merely above or below: costs under plan are good, revenue under plan
   is not, and a headcount under plan is neither until the material says so. One mark never
   stands for two of these.
3. **What changed and why**: two or three charts, each under a sentence.
4. **Goals and risks** as a short status list: a word beside every colour (on track, behind,
   done), one line of cause each.
5. **The decisions again, in full**: what is asked, what it costs, what happens without it.
6. **The tables**, folded, for the reader who checks.

Strict is not dull: the figures are large, the one accent is deep, the space is generous, and the
thing the numbers describe (a system, a flow) is drawn once, large, as the picture it is, and it
stands where the page opens, not after the tables. The page starts on a light ground: it is
printed and projected, and a dark scheme is a switch the reader may throw, not the default.
Strict means: one typeface family, one accent with one meaning, status colours only for status,
the same number format everywhere (thousands separated, one decimal at most, the unit in the
column head), no chart type the room has to be taught, nothing that moves unasked. Plain means: a
sentence a person would say aloud over every figure, the terms of the business and not of the
design, and nothing on the page that is not needed for the decision. The look still comes from a
world, a proportion and one strong figure; it shows in the setting, not in ornament.

## A message over the figures

Sometimes the person owns the message and asks the page to say it: this side burns, that side is
calm; this is the swamp, that is the way out. Then the page is a story with figures in it, loud if
the person wants it loud, and the metaphor is the world: colour, texture, drawing, motion, the
words of the headlines. What the metaphor may not touch is the figures' own register: every
number is the one the material holds, labelled by whose it is and how it was got; a side that is a
model or an intent rather than a measurement says so once, plainly, where the reader meets its
first figure; and the arithmetic stays on the page. The test is a reader who knows the subject
and disagrees with the message: they must be able to say "I read it differently", never "that
number is wrong" or "they hid whose number that was".

## Choosing the chart

| The question | Draw |
|---|---|
| how much, right now | a figure tile: the number, its delta, a sparkline |
| parts of one whole, five or fewer | a pie or a donut, labelled on the slices, the whole stated in the middle |
| parts of one whole, more than five, or compared across groups | stacked or grouped bars |
| which is bigger | bars, sorted, from a zero baseline |
| how it moved over time | a line; an area when the volume matters |
| how we got from one number to another | a waterfall |
| where it drops off along a path | a funnel |
| are we on target | a bullet bar or a gauge with the target marked |
| many things across many groups | a heat table |
| status of a list | a row per item with a word beside the colour |

A pie is right more often than designers admit: it is the fastest picture of "most of it is
this". It is wrong for more than five slices, for slices nobody can tell apart, for anything that
is not a whole, and for comparing two pies side by side. Start the largest slice at twelve
o'clock, write the labels on or beside the slices, and say what the whole is.

Craft: labels on the marks instead of a legend the eye has to travel to; a few rounded, meaningful
axis values; bars start at zero; one colour means one thing across the whole page; the accent goes
to the series or the mark that carries the message and the rest step back; categories that are
merely different (kinds, groups) take calm tones from the ground's family, so the accent is never
also a category; tabular numerals wherever numbers
line up. If a chart skill is available in your environment, use it for the craft. Charts are drawn
in SVG or canvas; a library (Chart.js, ECharts, D3) is welcome where the target can load it, and
is restyled to the page's world, never left in its defaults.

A drawing of connections with more than a few dozen edges is a tangle, not honesty. Show the
strongest edges by default and the rest as a layer the reader switches on, bundle edges by group,
or draw the matrix beside a drawing of the groups; a label never crosses an edge or another label
at the widest layout, and a drawing that would need to is redrawn, not shrunk.

## It answers the touch

`frame.md` asks that every piece be operated the way its kind is. For figures that means:

- a mark under the pointer or the focus shows its exact value, and the rest dim; where the chart
  has a legend or a list beside it, the row of that mark lights too, and the pointer on a row
  lights its mark and dims the others: both directions, for a pie as much as for a bar chart;
  the keyboard reaches each mark in turn;
- a legend entry switches its series on and off, and says so;
- a period or a group is changed with real controls (tabs, a segmented switch), and the page says
  which one is on;
- a filter answers in a sentence, after every change, in one `role="status"` line: what is shown
  of how much, and under which choices; every panel below it recomputes from the one data block,
  and a panel that does not says so in its own caption;
- a control that shows a count shows the count for what pressing it would give under the filters
  already set, or shows none: a count frozen at the whole sample beside a filtered page is wrong;
- a table sorts by the column that was pressed, and shows the direction;
- every chart has the table behind it one press away (`<details>`), which is also what a screen
  reader and a printed copy get;
- on a phone a wide chart becomes a simpler one or a short table, never a shrunken picture.

## The shelves

**Worlds.** The working ones, for numbers somebody decides from: an annual report (confident
numerals, generous colour blocks, one photograph-sized chart per spread); a consulting page
(white, one accent, a sentence over every chart); an investor letter (serif, calm, three charts
and no more); a financial daily's business page (columns, rules, small charts set into text); a
bank statement (ruled paper, ledgers, stamps). The ones an occasion invites, in the roll when the
numbers are live operations or the person named them: a control room (dark ground, lit gauges, a
status wall); a trading terminal (mono, dense, amber or green on black); a factory board (big
tiles, magnets, a shift's worth of numbers). A brand's own system always wins: its colours and
typeface settle those cards.

**Type.** A face with good figures: IBM Plex Sans, Inter Tight, Public Sans, Golos Text, Manrope,
Onest, Source Serif 4 or Literata for a letter. A display companion for the leading figure:
Archivo at a wide setting, Unbounded, Fraunces, Playfair Display. A mono for labels and table
heads: IBM Plex Mono, JetBrains Mono. Check the script the page is written in.

**Compositions.** A hero figure over a row of tiles over two charts. A wall of equal tiles, one of
them three times the size. A left rail of figures with one large chart beside it. A long scroll:
one question per screen. A one-page board summary: status strip, four charts, the decisions.

**Devices.** Figure tiles with a coloured edge; a status strip with words beside the colours; a
target line; an annotation drawn onto a chart like a hand went over it; small multiples; sparkline
rows; a callout for the one number that is off; a decision box when the page ends in a choice the
material itself holds. Where it holds none, the page ends on what the measurement lacks, never on
a decision invented to fill the box.

**Motion.** Bars and lines draw once, figures count up once, a change of period moves the marks
instead of replacing them. Nothing loops.

## Throw the dice

```
node <kubik>/scripts/roll.mjs \
  world="annual report|consulting page|control room|business page of a daily|trading terminal|factory board|bank statement|investor letter" \
  figures="IBM Plex Sans|Inter Tight|Public Sans|Golos Text|Manrope|Onest|Source Serif 4" \
  ground="white|warm paper|white with tinted bands of the accent|ink-dark|deep navy" \
  accent="signal blue|emerald|vermilion|ochre|violet|teal|magenta" \
  lead="one enormous figure|a row of tiles|a single chart across the page|a status strip" \
  device:2="annotated chart|small multiples|sparkline rows|target line|waterfall|donut with the whole in the middle|heat table|decision box"
```

A device card the material cannot fill is bent before it is used, and the bend is named in the
note: a decision box with no decision becomes "what the sources leave open and where they
disagree"; a target line with no target becomes the figure's own comparison. Nothing is invented
to fill a card. Before the command runs, take out of `figures=` every face that does not cover
the script the page is written in; for a board, take `ink-dark` and `deep navy` out of `ground=`
(the page starts light, above).

A brand settles `accent`, `figures` and often `ground`. "Serious", "for the board", "bank"
lean `world` toward the annual report, the consulting page and the investor letter; "live",
"operations", "monitoring" send a screen somebody operates to `system.md` ("A live screen"), and
lean numbers somebody only reads toward the control room and the factory board.

## Where this kind goes wrong

- A wall of equal grey cards, each with a number and nothing to compare it to.
- An opening row of bordered KPI boxes, an uppercase label over each: the 2012 admin template
  `system.md` names, with its habits in `page/habits.md`. The leading figure still leads, set large
  with its comparison; the rest sit in a sentence or one ruled row, ranked by text, not boxed.
- A chart whose title is a noun, so the reader has to work out what it shows.
- A pie with nine slices and a legend; two pies to compare; a donut with nothing in the middle.
- A 3D chart, a gradient-filled bar, a dual axis that invents a correlation.
- A library's default palette and tooltip on a page that otherwise has a world.
- Traffic-light colours with no words, so a colour-blind reader sees three greys.
- Numbers typed into the markup in five places, two of which no longer agree.
- A dashboard that cannot be operated: nothing answers the pointer, nothing can be switched.

## Before you call it done

- The leading figure is the first thing seen, with its unit, period and comparison.
- Every chart's title is a sentence the chart proves.
- Every total on the page was added up again; every derived figure shows how.
- Every chart answers the pointer and the keyboard in both directions (mark ↔ legend row), and has its table one press away; you moved the pointer over each one and watched the rest dim.
- The frame's audit was run: FRAME repaired, RICHNESS and the response line read.
