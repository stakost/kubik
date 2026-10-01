---
name: kubik
description: Use when a landing page, marketing site, portfolio, report, briefing, slide deck, presentation, dashboard, KPI summary, a page of figures and charts, or a design system, UI kit or DESIGN.md is to be designed or redesigned - "make a landing", "a deck", "slides", "a report", "отчёт", "презентация", "дашборд", "графики", "дизайн-система" - when the user gives mood words ("minimal", "premium", "brutalist", "cinematic", "corporate", "playful") or a reference, or when a page or a deck looks templated and should get a look of its own.
---

# Kubik: a free artist, a shared frame, and dice

Kubik makes pages, reports, decks, figures and design systems that do not look like each other. It has no house
style. It listens to what the person wants to see, throws dice for whatever they left open, picks
a concept and draws it, inside one frame: what the reader on the other side of the screen needs.

This file only finds your way. The work is in the files it sends you to. Every path is given from
this skill's own directory, the one this file was loaded from. In a command that directory is
written `<kubik>`: you run in the person's project, so give the scripts their full path
(`bash <kubik>/scripts/roll.sh` becomes `bash /…/skills/kubik/scripts/roll.sh`).

## 1. Listen

Before anything else, collect what the person said about what they want: the words the skill was
called with, the mood they named, a reference, a brand, the audience, what they are tired of
seeing. Then read what they did not say: who will read the piece, where it is shown, and what
they do with it afterwards. The words and the occasion lean the dice later (`method.md`, steps 1
and 2), so write them down as a short list; a piece close to what the occasion wants on the first
throw is the aim, with the experiment inside it, not instead of it.

- **A project that holds a `DESIGN.md`, a tokens file or a brand guide has already spoken.** Read
  it before anything else: its cards are settled, its register is the default, and only what it
  leaves free is rolled (`system.md`, "Afterwards").
- **A reference** (a link, a screenshot, "like that product") is read with `reference.md`: take
  its decisions, not its pixels.

- If the ask truly forks (you cannot tell a deck from a report, or two opposite moods both fit)
  and the person is there to answer, ask **one** question. Otherwise decide, and say what you
  decided.
- If the person is there and the piece is large, show your three concepts in one line each before
  you build, and go on with your own choice unless they point at another. Do not wait on it.
- If nobody is there to answer (you were dispatched with a brief), never ask: decide and report.
- **No material is not a licence to invent.** A piece needs content: figures, facts, a subject.
  If the ask names none and the project holds none, ask for it once when the person is there.
  Otherwise build on sample content, mark it as sample once where the reader sees it, and say so
  in the first line of your note.
- If the person asks what kubik can do, or gave no direction at all and is there to choose, show
  them `menu.md` cut down to the moment: the kinds, the registers, and the worlds of the kind they
  are nearest to.

## 2. Find the kind

| The piece is | Read |
|---|---|
| a landing page, marketing site, portfolio, editorial page, or a redesign of one | `page.md` |
| a report, briefing, audit, write-up: a document one reader decides from | `report.md` |
| slides: a talk, a pitch, a walkthrough, an idea shown on a stage | `slides.md` |
| figures: a dashboard, a KPI summary, a board pack, a page of charts and tables | `figures.md` |
| a system: a design system, a UI kit, tokens or a `DESIGN.md`, by default for software people work in (a back office, a console, a management system) | `system.md` |

A document that already exists and is to be remade keeps its kind unless the person says
otherwise: a deck stays a deck. When the person does change the kind (a deck into a page or a
report), the kind file's limits on length yield to the material: every figure and claim stays at
least once, repeats may merge, and `frame.md` §2 says how a remake treats the original's words. A board of numbers somebody reads is figures; a screen somebody
operates (an admin panel, a console, a live operational dashboard inside a product) is a system.

## 3. Find the style, if one was asked for

A page may be asked for in a style. Then the style file is read **instead of** `page.md`'s dials
and shelves; `page.md` §5 (the craft notes) and §7 (the done list) still hold for every page, and
the companion files in `page/` still apply at their moments (`page/scroll.md` for anything pinned
or scrubbed, `page/redesign.md` when a site already exists, `page/libraries.md` when the ask names
an existing design system or component library, `page/habits.md`, `page/shelf.md`):

| The person said | Read |
|---|---|
| minimal, editorial, typographic, "like a document" | `styles/minimal.md` |
| brutalist, industrial, blueprint, terminal, raw, technical manual | `styles/brutal.md` |
| premium, high-end, luxury, polished, "expensive" | `styles/luxe.md` |
| cinematic, scroll-driven, motion-rich, "like a film" | `styles/cinema.md` |
| anything else, or nothing | `page.md`, which sets its own dials |

For a report, a deck or figures, a style word does not change the file: it leans the dice toward
the worlds on that file's shelves that go the same way, and the style file may be read for its
materials (colour, type, texture) while the kind file keeps the structure. Mood words with no row
here ("corporate", "playful", "serious") name no file either: they lean the dice. "Clean", "simple" and "flat" on their own
name no style: they set the register, below.

## 4. Hear how loud

Every kind can be made at three volumes. The person's words set it; with no words it is the middle
one. Say which you took, next to the kind.

| The person said | Register | What it means |
|---|---|---|
| clean, flat, simple, calm, strict, "no frills"; строго, чисто, просто, спокойно | **quiet** | flat colour, nothing loops; the beauty is in type, proportion, space, one accent and one drawn detail. Read `quiet.md` after the kind or style file |
| nothing about it | **balanced** — except a system for software people work in, which is quiet with no word said (`system.md`) | the kind file as written |
| bold, striking, experimental, "wow" | **loud** | depth, atmosphere and motion are part of the idea; push the kind file's shelves as far as they go |

## 5. Read the three files every piece stands on

All required, before any code: `method.md` (how to work: listen, throw the dice, three concepts, a
signature moment, a world, build, look), `frame.md` (what the reader needs: true content,
readable, every width, keyboard, controls that answer, motion that stops) and `words.md` (what
the words on the piece say and how, for the person who reads them, not for a model that had to
produce something related). `words.md` §4 runs over every string before the piece ships.

## 6. Make it, look at it, say what you did

Follow the kind or style file. Roll with `bash <kubik>/scripts/roll.sh` and the command that
file gives, leaned the way the person pointed. Before the command runs, edit its string: a
typeface that does not cover the script the piece is written in comes out, and so does any card
the piece cannot carry; a card pruned after the throw is a throw wasted. Look at the result with
`node <kubik>/scripts/page-audit.mjs` (and `node <kubik>/scripts/deck-shots.mjs` for slides). Your closing note follows `frame.md`, and adds one line
for each wish you heard: settled, leaned, or set aside and why.

The scripts need what the machine may not have: the dice need `bash`; the lint needs Node 16 or
newer; the audit and the deck photographer need Node 22 or newer and a Chromium-family browser
(Chrome, Chromium, Edge, Brave, or the one Playwright or Puppeteer keeps in their cache; `--chrome
<path>` or `CHROME_PATH` names one the script did not find). A script that exits 3 could not run
here, and its message says what to do; exit 2 means it was called wrongly; exit 1 means the piece
has FAILs. Nothing is installed to get a check to run: `frame.md` §10 says how a check degrades.
