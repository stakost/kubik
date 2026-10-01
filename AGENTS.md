# Working in this repository

This repository is `kubik`: a plugin with one design skill, for Claude Code and Codex. These rules
are for whoever edits it, person or agent. To *use* kubik, read `README.md`; to *test* it, read
`TESTING.md`.

## Before you finish any change

```
node tests/run.mjs
```

Every line must be `PASS`. A change to a script, a hook, a manifest or a file name that the checks
do not cover gets a check in `tests/run.mjs` in the same change.

## The skill is one self-contained directory

Everything the skill needs is under `skills/kubik/`. A plugin is copied into a runtime's cache on
install, so a path that leaves that directory stops resolving there.

- Skill texts name other files by their path from `skills/kubik/` (`page/scroll.md`,
  `styles/brutal.md`), never with `../`.
- Commands are written `node <kubik>/scripts/…`. The agent runs in somebody's project, not in the
  skill's directory; `<kubik>` stands for the directory `SKILL.md` was loaded from.
- Only `SKILL.md` has frontmatter, and it has two fields: `name` and `description`. The
  description says when to reach for the skill and never how the skill works: a description that
  summarises the procedure becomes the shortcut an agent takes instead of reading the file.

## Where a rule lives

Each matter has one owner. State a rule there and name the file elsewhere; a rule written twice
drifts.

| Matter | File |
|---|---|
| finding the kind, the style, the register; listening to the person | `SKILL.md` |
| how the work goes; how wishes lean the dice | `method.md` |
| what every piece owes its reader; the audit; the closing note | `frame.md` |
| one kind of piece: its fixed lines, its shelves, its roll command | `page.md`, `report.md`, `slides.md`, `figures.md`, `system.md` |
| one page style | `styles/*.md` |
| the quiet register | `quiet.md` |
| borrowing from a reference | `reference.md` |
| what can be asked for by name | `menu.md` |

What goes into the skill is a direction for making designs: a principle an agent can apply to a
case nobody foresaw. A one-off request ("five variants of this") is work done with the skill, not
part of it.

## Writing

- English. A sentence earns its place by changing what an agent does; a rule stated twice, or an
  explanation of the obvious, goes.
- Shelves are examples, and say so. A fixed list that reads as a standard produces the same page
  every time, which is the failure this skill exists to prevent.
- A rule that takes something away (a defect) says what stays (the effect).

## Versions

One number, in four files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`,
`.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`. Change all four together; the
checks refuse a mismatch.

## Do not touch

`skills/kubik/scripts/vendor/axe.min.js` is third-party (axe-core, MPL-2.0) and ships unmodified,
with its notice. `LICENSE` and `NOTICE` change only on the author's word.
