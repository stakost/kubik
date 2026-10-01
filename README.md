# kubik

A design skill for coding agents: a free artist, a shared frame, and dice.

Kubik makes landing pages, reports, slide decks, pages of figures and design systems that do not
come out looking alike. It has no house style. It listens to what you want to see, throws dice for whatever you
left open, picks a concept and draws it, inside one frame: what the reader on the other side of
the screen needs. Every piece is opened in a real browser and checked before it is handed over.

Kubik is Russian for a die.

[**Open the landing page**](https://stakost.github.io/kubik/) and throw the die.

<a href="https://stakost.github.io/kubik/"><img src="https://stakost.github.io/kubik/img/die-throw.gif" alt="The landing page's hero. A die is thrown twice; each time it lands, the headline, colours, type and background of the page change to a different world: a cinematic night, a strict board page, and back." width="960"></a>

## New in 1.2: screens that show work as it happens

Ask kubik for a tracker, a console or a settings page and it now builds the screen for the person
who operates it. Where work runs over time (runs, deployments, agents, queues), the screen gets a
view shaped by time: an axis with a line for now, a feed where new items wait behind an "N new"
chip while you read, a panel that opens an item beside the list, and ⌘K for every action. Five
current characters join the seven older ones in the roll, and the skill names the look it steers
away from: an opening row of boxed KPI tiles with an uppercase label over each.

<img src="https://stakost.github.io/kubik/img/console-pair.jpg" alt="The same brief, an agent console, built twice. Left, a model on its own: five boxed KPI tiles, a bar chart and a table. Right, kubik 1.2: every agent's runs on one time axis with a line for now, scheduled work drawn dashed, a quiet gap labelled, and the table below." width="960">

The same brief built twice: by a model on its own (left) and with kubik 1.2 (right). In a blind
test, five interfaces were each built three ways and scored out of 25 by a critic who did not know
which was which. Kubik 1.2 came first on all five (114 in total), kubik 1.0 second (106), no kubik
third (87). It was one build per cell, so the order holds and the size of the gap is a first
reading.

## Install

**Claude Code**

```
/plugin marketplace add stakost/kubik
/plugin install kubik@kubik
```

**Codex**

```
codex plugin marketplace add stakost/kubik
```

then open `/plugins` and install `kubik`. Codex asks once whether to trust the plugin's hooks.

**From a local copy**, before or instead of the published repository, give either runtime the
path: `/plugin marketplace add /path/to/kubik` in Claude Code, `codex plugin marketplace add
/path/to/kubik` in Codex.

**Without the plugin machinery**, on any runtime that reads a skills directory: link
`skills/kubik` into it (`~/.claude/skills/kubik`, or `~/.agents/skills/kubik`). The hooks are not
installed this way.

The dice are a bash script and need nothing else. The lint needs Node 16 or newer and no browser.
The audit and the deck photographer need Node 22 or newer and a Chromium-family browser: they look
for Chrome, Chromium, Edge, Brave and the browsers Playwright and Puppeteer keep in their caches,
on macOS, Linux and Windows, and on PATH; `CHROME_PATH` (or `--chrome <path>`) names one they did
not find. Without a browser they exit with code 3 and a sentence saying so, and the lint still
runs; the skill tells the agent to carry on and say in its note what was not checked. The hooks
need `bash` (Git Bash on Windows). Nothing is installed from npm, and nothing ever installs
anything to make a check run.

## Ask

Say what you want, as briefly or as fully as you like. What you say leans the dice; what you leave
out is read from the occasion (who reads it, where, what for) and only then rolled. Start with the
word kubik, or invoke the skill by its name the way your runtime does (`/kubik:kubik` in Claude
Code).

For a text with no page around it (a memo, a report body, a post, a letter, a summary, or a
draft that reads like a model wrote it), the second skill, `kubik-words`, writes or rewrites it
for the person who will read it: what to keep for that reader, and the habits that give a machine
away, in English and in Russian. The same file runs over every string of every piece kubik makes.

```
kubik: slides about the quarter
kubik: a report, quiet, like a newspaper, green
kubik: landing for the plugin, loud, dark, no purple
kubik: figures for the board, our brand blue, with a pie of the cost split
```

| You can name | Choices |
|---|---|
| the kind | a page, a report, slides, figures, a design system |
| the register | quiet (clean, flat, simple), balanced, loud |
| a page style | minimal, brutal, luxe, cinema |
| a world | a broadsheet, a Swiss memo, a night sky, a control room, and the rest of `skills/kubik/menu.md` |
| a reference | a link, a screenshot, "like that product": kubik takes its decisions, not its pixels |
| anything else | a colour or a brand, a typeface, the audience, what must not appear |

Ask "what can kubik do" and it shows the menu.

A project that holds a `DESIGN.md` is read first: what it decides is kept, and only what it
leaves free is rolled. Kubik writes that file itself when asked for a design system.

## What it makes

Six finished pieces, built with kubik on sample content. Two are figures, two are design systems, and two are slides. The text inside them is Russian.

<img src="https://stakost.github.io/kubik/img/pieces.jpg" alt="Six pieces made with kubik: a newspaper-style board report, a consulting-style audit summary, a dark operations console, a playful design system with a 3D die, a cut-paper title slide and a night-sky title slide." width="960">

The same goes for the words. Kubik runs its words rules over every string it puts on a page, and `kubik-words` rewrites any text on its own.

> **A model's default.** In today's fast-paced digital landscape, great design is more crucial than ever. Kubik is a powerful, innovative design skill that seamlessly empowers developers to unlock stunning, cutting-edge interfaces. Ready to take your designs to the next level?

> **After kubik-words.** Kubik is a skill for Claude Code and Codex that designs pages, reports, slides, figures and design systems. Tell it what you want to see, in any words. It throws dice for whatever you left open, draws one concept, and opens the result in a real browser before it hands it to you.

## How it works

The same message, thrown into six worlds. Each is a different feeling and a different way of showing information; the words stay put.

<img src="https://stakost.github.io/kubik/img/worlds.jpg" alt="Six screenshots of one short message set in six different designs: a strict board page, a cinematic night, a brutal blueprint, a human letter, a candy shop and an acid poster." width="960">

- **The frame** (`frame.md`) is what the reader needs: true content, text that can be read, a
  page that works on a phone and from a keyboard, controls that answer the touch, motion that can
  be stopped. It says nothing about how a piece should look. Its governing rule: repair the
  defect, keep the effect.
- **The method** (`method.md`) is how the work goes: listen, throw the dice, three concepts to choose
  from, one signature moment, a world with its own light and depth, the build, one more step past
  comfortable, and then the frame.
- **The shelves** in each kind and style are examples to choose from, not a standard: worlds,
  typefaces, devices, charts, motion.
- **The dice** (`scripts/roll.sh`) pull a card from each shelf at random, so the work does not
  begin with the most likely answer. A wish settles a card or weights it (`night sky*3`).
- **The cheap look first** (`scripts/lint.mjs`) reads the file in a second, without a browser, and
  names what the audit would fail. `scripts/deck-runtime.js` is the shared machine of a deck (keys,
  wheel, swipe, hash, builds, overview, notes, reading mode), copied into each deck so that nobody
  rewrites it wrong; `scripts/page-runtime.js` is the pause control and the theme switch for any
  piece.
- **The look before shipping** (`scripts/page-audit.mjs`) opens the piece in a browser at desktop
  and phone width, in dark mode and with reduced motion, walks it with the keyboard, and ends its
  output with two lists: FRAME (pass, fail, warn) and RICHNESS (how much atmosphere, graphics, motion and
  response the piece has). For slides, `scripts/deck-shots.mjs` photographs every slide, measures
  its text, and tries the controls: arrow, wheel, button, swipe.

## How it lives in a session

One skill, one description in the session's list. Its other files are read only when the work
calls for them. Three hooks each add one short line and never load the skill themselves:

- at session start, and after a clear, a compaction or a resume: kubik exists, and when to load it;
- on a prompt that reads like design work, at most three times a session: load kubik, and pass it what the
  person said;
- when a subagent starts: the same, since a subagent does not see the session's skill list.

The same three hooks are wired for both runtimes. They were tested by feeding the script sample
events; in a live session only Claude Code's session hook format is known to work, from another
plugin that uses it. `TESTING.md` lists what to confirm on each runtime.

The prompt hook keeps its count of reminders in `${XDG_STATE_HOME:-~/.local/state}/kubik/`, one
small file per session, swept after a day. It is the only thing the plugin writes outside its own
directory.

## Layout

```
skills/kubik/
  SKILL.md         the entry: listen, find the kind, the style, the register
  method.md        how to work
  frame.md         what every piece owes its reader
  words.md         what the words on it say, and how, for the person who reads them
  quiet.md         the quiet register, for any kind
  menu.md          what can be asked for
  page.md          a landing page, with page/ for its companion files
  report.md        a report
  slides.md        a deck
  figures.md       a dashboard, a board pack
  system.md        a design system for working software: the record, the tokens, the specimen
  reference.md     how to borrow from a reference
  styles/          minimal, brutal, luxe, cinema
  page/            shelf, scroll, redesign, habits, libraries: a page's companion files
  scripts/         roll.sh, lint.mjs, page-audit.mjs, deck-shots.mjs, browser.mjs, page-runtime.js, deck-runtime.js, vendor/axe.min.js
skills/kubik-words/
  SKILL.md         the text skill: a router to skills/kubik/words.md
hooks/
  kubik-hook       one script, three modes: session, prompt, subagent
  hooks.json       the wiring for Claude Code
  hooks-codex.json the wiring for Codex
tests/
  run.mjs          the package's own checks: node tests/run.mjs
  fixtures/        four small pages the checks run on
TESTING.md         what to test by hand on each runtime, and how to report it
AGENTS.md          rules for whoever edits this repository
```

## Licence

Apache License 2.0, see `LICENSE`. Kubik may be used, changed and redistributed, in commercial and
corporate work included. Whoever redistributes it, or a work derived from it, keeps the `NOTICE`
file: the author's name and the link to this repository stay with every copy.

Pages, reports, decks and systems made *with* kubik are yours; the licence asks nothing of them.

`skills/kubik/scripts/vendor/axe.min.js` is axe-core by Deque Systems, distributed unmodified
under the Mozilla Public License 2.0; its notice is at the top of the file.
