#!/usr/bin/env node
// kubik's hooks: one short line at the moments an agent would otherwise forget the skill exists.
//
//   kubik-hook.mjs session    session start, and after /clear, /compact and resume
//   kubik-hook.mjs prompt     a prompt that reads like design work; at most three times a session
//   kubik-hook.mjs subagent   a subagent starts: it does not see the session's skill list
//
// Each line costs a few dozen tokens. The skill itself is never loaded here: the agent loads it
// when the work calls for it. A failure prints nothing and never blocks the session: this script
// exits 0 whatever happens, since an exit code of 2 would block the prompt.
import { readFileSync, mkdirSync, appendFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

const emit = (event, text) => {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: text } }, null, 2) + '\n');
};

// Nouns that name a piece on their own, or a making verb near a word that is too common alone
// ("report", "chart", "deck"): a bare one is too often a bug report or a deck of cards. A word
// boundary before Cyrillic is spelled out with a lookbehind, since \b knows no Cyrillic.
const NOUNS = /\bkubik\b|кубик|landing page|website|веб-?сайт|(?<![\p{L}\p{N}_])сайт|pricing page|лендинг|presentation|презентац|\bslides\b|slide deck|pitch deck|слайд|dashboard|дашборд|redesign|редизайн|portfolio|портфолио|design system|ui[ -]kit|design\.md|дизайн-систем|\bkpi\b/iu;
const MADE = /(make|build|create|design|draw|prepare|write|draft|rewrite|humani[sz]e|сдела|оформ|собер|подготов|нарису|напиш|перепиш|очеловеч|нужен|нужна|нужно).{0,60}(report|chart|deck|infographic|memo|post|letter|summary|отч[её]т|доклад|диаграмм|график|инфографик|письм|пост|заметк|текст|статью|сводк)/iu;

const readInput = () => {
  if (process.stdin.isTTY) return '';
  try { return readFileSync(0, 'utf8'); } catch { return ''; }
};

// Only the prompt is read: the rest of the event (the working directory, a transcript path) is
// full of words like "dashboard" that say nothing about what was asked.
const promptOf = (input) => {
  try {
    const p = JSON.parse(input)?.prompt;
    return typeof p === 'string' ? p : '';
  } catch {
    return /"prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(input)?.[1] ?? '';
  }
};

const sessionOf = (input) => {
  try {
    const s = JSON.parse(input)?.session_id;
    if (typeof s === 'string' && /^[A-Za-z0-9_-]+$/.test(s)) return s;
  } catch { /* fall through */ }
  return /"session_id"\s*:\s*"([A-Za-z0-9_-]*)"/.exec(input)?.[1] || 'unknown';
};

const main = () => {
  const event = process.argv[2] || 'session';
  if (event === 'session') {
    emit('SessionStart', 'kubik is installed. Before you design or redesign a landing page, a report, a slide deck, a page of figures and charts or a design system, load the kubik skill: it takes what the person wants to see, rolls dice for what they left open, and checks the result in a browser. Before you write or rewrite a text for a person to read (a memo, a report, a post, a letter, a summary), load the kubik-words skill.');
  } else if (event === 'prompt') {
    const input = readInput();
    const prompt = promptOf(input);
    if (!prompt || !(NOUNS.test(prompt) || MADE.test(prompt))) return;
    const state = join(process.env.XDG_STATE_HOME || join(homedir() || tmpdir(), '.local', 'state'), 'kubik');
    const marker = join(state, `reminded-${sessionOf(input)}`);
    // At most three reminders a session: one is lost to a prompt that only sounded like design.
    // Markers older than a day are swept, so the directory does not grow.
    let seen = 0;
    try {
      for (const f of readdirSync(state)) {
        if (!f.startsWith('reminded-')) continue;
        try { if (Date.now() - statSync(join(state, f)).mtimeMs > 864e5) unlinkSync(join(state, f)); } catch { /* ignore */ }
      }
      seen = statSync(marker).size;
    } catch { /* no state yet */ }
    if (seen >= 3) return;
    try { mkdirSync(state, { recursive: true }); appendFileSync(marker, 'x'); } catch { /* the cap is best effort */ }
    emit('UserPromptSubmit', 'If this request is for a page, a report, slides, figures or a design system to be designed, load the kubik skill before you start, and pass it what the person said they want to see: those words lean its dice. If it is for a text to be written or rewritten for a person (a memo, a report, a post, a letter, a summary), load the kubik-words skill first.');
  } else if (event === 'subagent') {
    emit('SubagentStart', 'The kubik design skill is installed. If your brief asks for a page, a report, a slide deck, a page of figures or a design system to be designed, load kubik and follow it; if it asks for a text written for a person, load kubik-words.');
  }
};

try { main(); } catch { /* a hook never blocks the session */ }
process.exit(0);
