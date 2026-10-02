# A system: one throw, kept

A design system, a UI kit, a product's tokens: a visual language written down so that every later
screen continues it instead of starting again. Everywhere else in kubik the dice are thrown for
each piece. Here they are thrown once, at the birth of the system, and the throw is kept:
recorded, named, and handed to whoever builds next.

This kind makes the language, its record and a specimen that proves it. It does not write a
component library. Where the product already has one (`page/libraries.md` lists the usual ones), the
system is delivered as that library's theme, not as a second set of components beside it.

**Read before any code, both required:** `method.md` (how to work here) and `frame.md` (the frame
every piece stands in).

## What a system is for

Software people work in: a back office, a console, a control panel, a management system. Hours a
day, dense data, long forms, many states, a person who is there to get something done. That is
the default reading of "a design system", and it changes what good means:

- **The familiar is a feature.** Someone who has used three such tools should know this one on
  sight: where the navigation is, how a table sorts, what a primary button looks like, where an
  error appears. Nobody should have to learn the layout.
- **Clarity before character.** The character is there, and it is quiet: it lives in the type, the
  proportions, the discipline of the accent and the quality of the states, never in where things
  are or how they move.
- **It is not a landing page, and neither is its specimen.** No hero, no tagline at poster size,
  no scroll theatre, no decoration. Nothing here borrows from `page.md`, the page styles or the
  loud register.

With no word about it, the register of an application system is quiet: read `quiet.md` too, for
how RICHNESS is read and what stays when decoration goes.

A system for a brand's site and marketing is the other reading, and only when the person says so
("for the site", "for the brand", "for our landing pages"). Then the looser characters at the end
of this file apply, and the specimen may show itself off.

## What makes it a system

- **Decisions, not options.** "The accent is used for the one primary action in a region", not
  "here are five blues".
- **Roles before values.** A colour is named for what it does (ground, surface, text, muted text,
  line, action, danger), and only then given a value. The dark theme is the same roles with other
  values.
- **Every component has every state**: rest, hover, focus, pressed, selected, disabled, busy,
  wrong, empty. A kit of buttons at rest is a drawing of a system.
- **A handful of decisions make it recognisable.** Five at most, written as rules somebody could
  check. Everything else follows from them.
- **It is proven on working screens.** A list, a record and a form, assembled only from the kit.

## The conventions, which are not rolled

An application system keeps the skeleton its users already know. The dice never touch these.

- **The shell.** Navigation down the left, collapsible; a top bar with search, the current context
  and the account; the work in the middle; a detail panel on the right when a record is opened
  beside a list.
- **One primary action per region**, in the same place on every screen. Destructive actions stand
  apart and ask before they act.
- **A list is a table**: headers that sort, filters above, a row that can be selected, actions for
  the selection, a count and pages, a header that stays while the rows scroll; and the same table
  empty, loading and failed.
- **A record** opens as a page or a side panel, with tabs for its facets and its status at the
  top.
- **A form** is one column: the label above the field, help under it, the error beside the field
  in words, required fields marked, the primary button at the end. A long form goes in steps and
  says where you are.
- **Status is a word with a colour and a shape**, the same word, colour and shape everywhere.
- **Feedback has a fixed place**: beside the field for a field, a toast for an action that
  finished, a banner for the state of a page, a dialog only to confirm or to ask.
- **Data is set as data**: numbers right-aligned in tabular figures, identifiers and codes in a
  mono, dates in one format, units in the column head.
- **The keyboard does everything**: every control is reached and operated, focus is always
  visible, the order follows the reading order, frequent actions have shortcuts that are shown.

## A live screen

Some screens show work happening over time: runs, deployments, agents, queues, incidents. A
table of rows that change in place hides exactly what the person came to see, so such a screen
adds a time-shaped view to the conventions above. These are directions, not a layout:

- **Time is an axis** when duration, overlap or silence matters: a now-line, history to its left,
  only declared or scheduled things to its right (drawn dashed and labelled, never predicted), and
  a "back to now" control once the person scrolls away. Silence is drawn, and its age written.
- **Events are a feed** when order matters more than duration: an arrival is highlighted for 400
  to 600ms and settles; rows already on screen keep their place; while the person reads or hovers,
  arrivals wait behind an "N new" chip instead of pushing the list.
- **A peek panel** opens the selected item beside the list or the axis without leaving it: Space
  or a click opens it, the arrows step through neighbours, Esc closes, the address holds the
  selection.
- **A command palette** (⌘K or Ctrl+K) reaches every action and object; filters sit as chips the
  person can see and remove.

When the product is live, the specimen shows one of these working, beside the list.

## What is handed over

1. **`DESIGN.md`, the record.** Short enough to be read in one sitting, exact enough to build
   from. In this order:
   - *The line*: the system in a phrase ("an instrument panel at night", "a ledger ruled for
     process").
   - *Mood*: one paragraph. Who works in it, for how long, what it refuses.
   - *The five decisions* that make it recognisable.
   - *Colour*, by role, light and dark, each text-on-surface pair with its contrast; the status
     colours with the word and the shape each one travels with.
   - *Type*: families and why these, the scale with sizes, weights, line heights and tracking, and
     the rules (what sets a page title, a table, a label, a number).
   - *Space and shape*: the unit and the ladder of distances, the densities, the radius vocabulary
     and which component takes which.
   - *Depth*: how one thing sits above another, as a strategy and not a list of shadows.
   - *Motion*: durations, easing, what moves and what never does.
   - *Patterns*: the shell, the list, the record, the form, feedback, as they are in this system.
   - *Components*: for each, its anatomy, its sizes and its states, in words and tokens.
   - *Data*: number, date and identifier formats; how empty, loading and error look.
   - *Do and do not*: five to seven each, specific to this system and checkable ("no weight above
     600"; "one filled button per region"). A rule that fits any system is left out.
   - *Free cards*: what a later screen may still decide for itself, so the system stays a frame
     and not a template.
2. **`tokens.css`**: the same decisions as custom properties, named by role, with the dark theme.
   Add the target's own form when there is one (a Tailwind theme, a library's theme object).
3. **The specimen**: an application, not a page about one. It opens on the shell with a working
   list screen: a table with sorting, filters, selection, an action for the selection and pages.
   From there a record opens (a panel or a page, with tabs), and a form can be filled in wrongly
   and corrected. A small overview of tiles and one or two charts, when the product has one
   (`figures.md` for the charts). Only after the screens comes the reference: the palette with
   roles and measured contrast, the type scale in real words, distances, radii and depth at size,
   and every component in every state, live. A switch between themes and between densities. A
   state held still for the eye (hover, focus, pressed) is a picture of the state: it is labelled
   as a sample and kept out of the tab order, and the live component beside it is the one that
   answers. A busy state is a still mark and a word before it is a spinner.

## The frame, for a system

`frame.md` applies to the specimen, and through the tokens to everything built later:

- every text-on-surface pair the system allows is listed with its contrast, and none is under
  4.5:1 (3:1 for large type and for the edges of controls);
- a focus ring is a token, visible on every surface of the system;
- target sizes are tokens: 24px the least, 44px for the main actions on touch;
- a state is never carried by colour alone;
- motion has a reduced form in the tokens themselves.

An application system is quiet by nature, so its RICHNESS is read as `quiet.md` reads it:
gradients, shadows and loops near zero are the intent; what must not be near zero is the response
line, and what matters most the script cannot count: whether every state exists. One rule of
`quiet.md` does not apply here: the one about scale. The largest type in working software is a
page title, and it stays modest; hierarchy comes instead from text roles (primary, secondary,
tertiary) and from space, not from boxes.

## The shelves

**Characters, for software people work in.** An instrument panel: dark, exact, a mono for every
reading. A ledger: ruled, calm, tabular. A clean office: white, one blue, nothing surprising, done
properly. A public service: plain words, high contrast, large targets. A workshop: warm neutrals,
sturdy controls, sized for a tablet and a hurried finger. A clinic: cool white, one calm colour,
legibility above everything. A control desk: a dark shell around a light working surface.
And current ones, from software people use now: a dense dark tool (tinted near-black, borders at
about 8% white, one accent); a calm SaaS console (white, generous rows, text roles doing the
hierarchy); a developer console (mono where it reads, logs and keys first); an observability
canvas (time across the screen, colour only for state); a native-feeling app (a translucent
sidebar, system type). Examples all, the old and the new alike.

**Colour logic.** A neutral ramp of eight to ten steps, warm, cool or true; one accent; four
status meanings (good, caution, wrong, note) tuned to the neutrals instead of taken at full
saturation. More colours than that need a reason. The accent means "this acts" and never a
state: when it falls near a status colour (a green accent beside "good"), the status moves to
another hue, so that no colour says two things.

**Type.** A sans built for interfaces: a neutral grotesque, a humanist sans, a geometric sans. A
mono for data and code. No display face: the largest type in an application is a page title.
Choose for the script the product is written in, for tabular figures, and for how it reads at 13
and 14 pixels.

**Shape.** A radius vocabulary of two or three small values: none; 2 and 4; 4, 6, 8; 6, 10, 14.
One vocabulary per system. Pills are for tags and switches, not for buttons and fields.

**Depth.** Hairlines only. Tonal layers. Soft shadows on overlays only (menus, dialogs, toasts).
Translucent chrome: blur behind sticky bars and overlays, contrast checked against what shows
through. One strategy per system.

**Density.** Compact and regular, both defined; one is the home.

**Motion.** Instant, or quick and eased (120 to 200ms), for overlays and state changes only.
Live: arrivals highlight and settle, and a short, critically damped spring follows direct
manipulation (a drawer, a drag, a reorder). Nothing bounces where people work: no overshoot.

**The kit.** Button and icon button (primary, secondary, quiet, destructive; two sizes), link,
text field, text area, select or combobox, checkbox, radio, switch, date field, tabs, segmented
control, tag and status badge, tooltip, menu, table (sortable, selectable, with row actions),
pagination, breadcrumbs, side navigation, top bar, panel, drawer, dialog, toast, banner, empty
state, skeleton, progress, stepper; for a live screen, command palette, timeline or gantt,
activity feed, peek panel or inspector, filter chips, shortcut hint. Build what the product needs;
a list, a record and a form cannot be made with fewer than about fifteen of these.

## Throw the dice

```
node <kubik>/scripts/roll.mjs \
  character="instrument panel|ledger|clean office|public service|workshop|clinic|control desk|dense dark tool|calm SaaS console|developer console|observability canvas|native-feeling app" \
  home="light|dark|a dark shell around a light surface" \
  neutrals="cool|warm|true grey|tinted toward the accent" \
  accent="blue|teal|emerald|indigo|violet|amber|vermilion" \
  voice="a neutral grotesque|a humanist sans|a geometric sans" \
  shape="no radius|2 and 4|4, 6, 8|6, 10, 14" \
  depth="hairlines only|tonal layers|soft shadows on overlays only|translucent chrome" \
  density="compact|regular" \
  motion="instant|quick and eased|live"
```

A product that exists settles most of these before the throw: its colour, its typeface, its
logo's shapes. What the person said leans the rest: "engineers, all night" leans toward the
instrument panel and the dark home; "anyone must understand it" toward the public service and the
clean office; "on a tablet, in gloves" toward the workshop and regular density; "live",
"agents", "ops" toward the current characters, the analog seven staying in at weight one.

Before the throw, study the field: name three current products that do the same job and write
each one's line and its two or three carrying decisions as `reference.md` reads a reference,
saying whether by browser or from recall. They lean the cards as someone else's product does
there; they settle none.

## From a piece that already exists

"Make a system out of this screen" is this kind run backwards: read the piece, name its five
decisions, lift its values into roles, and then fill in what one screen never needed: the states,
the components it did not use, the dark theme. Say which parts were found and which were added.

## Afterwards

The record is the point. A project that holds a `DESIGN.md` has said what it wants before anyone
asks: every later page, report, deck or page of figures reads it first, takes its cards as
settled, and rolls only the free ones. In a kind's roll command that means dropping the groups the
system decides (whichever groups set colour, ground, accent, atmosphere and the typeface: `type`,
`reading`, `display` or `figures`, by kind) and throwing the rest: the hero or the
lead, the devices, the world of this one piece. The register is the system's own unless the person
asks for another, and then only as far as the system's rules allow. The closing note lists each of
the system's decisions and rules as kept, or broken and why.

## Variants inside a system

The system already exists and is not the work. The person hands over a finished one (tokens, a
`DESIGN.md`, components, a screenshot) and asks for options of one component or case: a 24-hour
timeline, a stream's side panel, an "N new" queue, a filter builder. Nothing above is rolled, no
character is chosen and nothing in the system is redesigned; this section replaces the rest of the
file for that ask, except that `method.md` and `frame.md` still hold.

The input can be anything, so it is made one thing first: write `system.map.json` in the format of
`system/map.md`, from whatever arrived, and say which groups are claims. Every variant is then built
only from that map.

**Fixed:** everything the map holds, the system's states (a component has every one it has in the
system), its keyboard rules, its density rules and its `rules` list. **Thrown:** the composition,
how the data is encoded, the interaction model, how detail is disclosed, the motion within the
map's motion tokens (none, when it has none), and which density is the home.

Throw once per variant, three to five variants, and throw again where two variants share their
composition and their encoding. These shelves are examples; the component decides which are
worth having, and the person's words lean them:

```
node <kubik>/scripts/roll.mjs \
  composition="a single column|a split|a layered stack|small multiples|a master and a detail|a ribbon|an overlay on the work" \
  encoding="position on an axis|length|colour intensity|a glyph per item|a table of numbers|a sparkline per row|text only" \
  interaction="click to open|hover to peek|drag to select|keyboard first, with a cursor|a command line|direct edit in place|a stepper" \
  disclosure="everything shown|summary first, detail on demand|opens by zoom|grouped and collapsed|a peek panel|a tab per facet" \
  motion="none|a settle on arrival|a short slide|a cross-fade" \
  density="compact|regular|both, with a switch"
```

No throw here is exact, and none is meant to be: the same ask twice gives other variants. What is
exact is the check, which gives the same verdict on the same file. A value the system lacks is
proposed, never improvised: the variant declares it in its own `variant-N.map.json` with a name, a
value and a reason, and uses it by name.

**Hand over:** one specimen page with every variant on it, each shown in every state; each variant
also as a standalone HTML and CSS snippet that carries its own `:root` of the tokens it uses;
`system.map.json` and one `variant-N.map.json` per variant; and a note naming, for each variant,
the throw, what it proposed, and which groups of the map are claims.

**Check:** on every variant, until the summary line (`N values: X from the system, Y proposed, Z
forbidden`, with `, W unknown` when there are any) shows `0 forbidden` and no unknown; a WARN about a
`var()` the map lacks is read and answered, not left. Then the frame's check on the specimen page (`frame.md` §10).

```
node <kubik>/scripts/tokens-lint.mjs variant-N.html --map system.map.json --map variant-N.map.json
```

## A system for a brand's site

Only when asked for. The conventions above do not bind it, the specimen may open like a page, and
the characters are looser: a precision instrument in the dark; a warm editorial in cream and
serif; a soft consumer product in round corners and pastel; an industrial catalogue in mono and
one signal colour; a sticker sheet, chunky and saturated; a lab notebook in paper white and
highlighter. Shape may go to pills, depth to hard offset shadows, motion to a spring. Everything
else in this file holds: roles, states, five decisions, the record.

## Where a system goes wrong

- It looks like a landing page: a hero, a slogan, a gradient, and one table at the bottom.
- It looks like a 2012 admin template: a row of bordered KPI boxes as the opening, an uppercase
  micro-label and a number over every block, a hairline box around every region, medium type
  everywhere. `page/habits.md` and `method.md` "Of its time" name these habits; what stays is the
  shell and the table, with hierarchy carried by text roles and space.
- The navigation is somewhere clever.
- A palette with names and no roles, so nobody knows which grey is the text.
- Components drawn only at rest; a table that is never empty, loading or wrong.
- Forty colours, nine radii, six shadows: a catalogue of options instead of decisions.
- Tokens that the specimen itself does not use.
- Rules that fit any system ("be consistent", "use whitespace").
- A famous product's system with the accent changed. `reference.md` says how to borrow.

## Before you call it done

- The line and the five decisions are written, and the screens visibly follow them.
- A person who has never seen it finds the navigation, the primary action and the search without
  looking for them.
- The list sorts, filters, selects and pages; the form can be got wrong and says how to fix it;
  the record opens and closes.
- Every colour pair in use is listed with its contrast; the dark theme and both densities exist
  and were looked at.
- Every component shows every state, and answers the pointer, the keyboard and the press.
- The frame's audit was run on the specimen with `--views` naming every screen (the list, the
  record, the form, the overview, the reference): FRAME repaired on each, every picture opened,
  the response line read. A screen nobody photographed is a screen nobody checked.
