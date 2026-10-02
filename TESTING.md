# Testing kubik

Three layers. The first is a command; the second and third need a runtime with the plugin
installed and somebody to look at what comes out. Report in the shape given at the end.

## 1. The package's own checks

```
node tests/run.mjs
```

Needs Node 22 or newer, and a Chromium-family browser for the browser part (`--no-browser` skips
it; with none found it is skipped with the reason; `CHROME_PATH` points at one the search missed). It checks the manifests, the skill's
frontmatter and file references, every roll command as written, the lint, the shared deck runtime, the three other scripts (arguments, exit codes, a sound page, a broken
page, a page with two screens, a small deck and its four controls) and the hook script. Every line
is `PASS`, `FAIL` or `SKIP`; the exit code is 0 only when nothing failed.

Expected: every line PASS or SKIP, 0 failed; the runner prints the totals.

## 2. Installing, and the hooks

Nothing here has been confirmed in a live session. Each line is a thing to try and the result to
write down.

**Install from a local copy**

| Runtime | Do | Expect |
|---|---|---|
| Claude Code | `/plugin marketplace add /path/to/kubik`, then `/plugin install kubik@kubik` | the skill `kubik` appears in the session's skill list |
| Codex | `codex plugin marketplace add /path/to/kubik`, then install `kubik` from `/plugins` | the skill is listed; Codex asks once whether to trust the hooks |

**Hooks**, on each runtime:

1. Start a new session. Is there a line beginning "kubik is installed" in the context? (Ask the
   agent to quote what it was told about kubik at session start.)
2. Type a design request ("make a slide deck about our quarter"). Does the agent load the skill
   before doing anything else? Was a reminder added?
3. Type a request that is not design ("fix the failing test"). No reminder should appear.
4. Have the agent start a subagent on a design task. Does the subagent know the skill exists?
5. After a compaction or a `/clear`, does the session-start line come back?

Unknowns to settle on Codex in particular: whether `${PLUGIN_ROOT}` is set for plugin hooks;
whether `UserPromptSubmit` and `SubagentStart` accept context through `hookSpecificOutput`; whether
an event Codex does not know makes it reject the whole hooks file. If the hooks file is rejected,
reduce `hooks/hooks-codex.json` to the `SessionStart` entry and report which entry broke it.

**How the skill is invoked.** Record the exact form that works on each runtime (`/kubik:kubik`, a
mention of the skill's name, something else), and whether the agent is told the skill's directory
when it loads it: the scripts are run as `node <that directory>/scripts/…`, so an agent that
cannot learn the directory cannot roll the dice.

## 3. What the skill makes

Give the agent each ask below, exactly as written, in an empty project. Do not help it. For each,
record what is asked under "Record".

| # | Ask | It should read, in order | It should hand over |
|---|---|---|---|
| 1 | `kubik: a landing page for a note-taking app for musicians` | `SKILL.md`, `page.md`, `method.md`, `frame.md` | one page; three dial values stated; the throw; a concept in a line |
| 2 | `kubik: the same page, but clean, flat and simple` | `SKILL.md`, `page.md`, `quiet.md`, `method.md`, `frame.md` | a page with no gradients, shadows or loops, and a largest type at least four times the body size |
| 3 | `kubik: a brutalist landing page for a bike repair shop` | `SKILL.md`, `styles/brutal.md`, `method.md`, `frame.md` | a page in that style; `page/scroll.md` read only if something pins or scrubs |
| 4 | `kubik: slides about why our team should adopt code review, for twenty minutes` | `SKILL.md`, `slides.md`, `method.md`, `frame.md` | a deck; about forty words a slide; all four controls turn it |
| 5 | `kubik: a report for my manager on the attached numbers` (attach any small table) | `SKILL.md`, `report.md`, `method.md`, `frame.md` | the answer as the headline; opinion marked apart from what was measured |
| 6 | `kubik: a quarterly report for the board from the attached numbers, strict and clear` | `SKILL.md`, `figures.md`, `quiet.md`, `method.md`, `frame.md` | the verdict as the headline, the asks before any chart, every figure against its plan, a table behind every chart |
| 7 | `kubik: a design system for the back office of an insurance company` | `SKILL.md`, `system.md`, `quiet.md`, `method.md`, `frame.md` | `DESIGN.md`, tokens, and a specimen that is an application: a list, a record, a form |
| 8 | With the `DESIGN.md` from 7 in the project: `kubik: a landing page for the same company` | `SKILL.md`, the `DESIGN.md`, `page.md`, `method.md`, `frame.md` | a page that keeps the system's five decisions and says so, one by one |
| 9 | `kubik: a page like <a real site you name>, but for a bakery` | `SKILL.md`, `reference.md`, `page.md`, `method.md`, `frame.md` | the reference's line and decisions written down; what was taken and what was changed |
| 10 | `kubik: slides about the quarter` (no data given) | `SKILL.md`, `slides.md`, … | one question if you are there; otherwise sample content, marked as sample, and said in the first line of the note |
| 11 | `what can kubik do?` | `SKILL.md`, `menu.md` | a short menu, no piece built |
| 12 | `kubik: a live console for agent runs, dark` | `SKILL.md`, `system.md`, `quiet.md`, `method.md`, `frame.md` | three current products named before the throw; a specimen with a time axis and a now-line, a peek panel and a command palette; no bordered KPI row, no uppercase label over every block, no hairline box around every region |
| 13 | With a `tokens.css` or a Tailwind config in the project: `kubik: four takes on a stream side panel, built from these tokens` | `SKILL.md`, `system.md`, `system/map.md`, `method.md`, `frame.md` | `system.map.json` with a `source` on every group; three to five variants that differ in composition and interaction, each in every state and as a standalone snippet; `tokens-lint` printing `0 forbidden` for each; anything the system lacked listed as proposed |

**Record, for each ask**

- the files the agent read, in order (ask it, or read its transcript);
- the throw: the exact roll command it ran and what came out; whether your words settled or
  leaned any card;
- the last lines of `page-audit` (`N FAIL, N WARN`, and the `response` line), and for a deck the
  `controls` line of `deck-shots`;
- one screenshot of the first screen, and one of a phone width;
- its closing note;
- your own judgement in two sentences: would a person who asked for this recognise it, and would
  they enjoy looking at it.

**What counts as a failure of the skill** (as opposed to a weak piece):

- the agent built without reading `method.md` and `frame.md`;
- no dice were thrown, or the throw was ignored without a reason;
- content was invented (numbers, quotes, names) and not marked;
- the audit was not run, or a FAIL was left standing;
- a deck that does not turn by keyboard, wheel, button and swipe;
- a design system whose specimen is a landing page;
- two asks in a row came out looking alike.

Ask 1 twice, in two fresh sessions: the two pages should differ in concept, not only in colour.

## Reporting

One file, `TEST-RESULTS.md`, at the repository root, with three sections matching the three
layers. Findings as a list, not a table. Each finding: which ask or check, what happened, what was
expected, and the file and line of the skill you think is responsible. Say plainly which parts
were not run and why.
