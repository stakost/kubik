#!/usr/bin/env node
// roll: a real throw of the dice, so a design does not start from the most likely answer.
//
//   node roll.mjs colour="ember|tide|moss" type="A + B|C + D" hero="poster|split|cascade"
//
// Prints one card per group, drawn with the system's random source (node:crypto).
// A group may ask for several cards:        effects:2="grain|glass|halftone|bloom"
// A card may be weighted to lean the dice:  ground="night sky*3|warm paper|white"
// A card weighted *0 is taken off the shelf.
//
// Needs Node 16 or newer. Exit code: 0, or 2 on a usage error.
import { randomInt } from 'node:crypto';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('usage: node roll.mjs group="a|b|c" [group:2="a|b|c|d"] [group="a*3|b"] ...');
  process.exit(2);
}

const lines = [];
for (const arg of args) {
  const eq = arg.indexOf('=');
  if (eq < 1) {
    console.error(`roll: cannot read "${arg}" (expected group="a|b|c")`);
    process.exit(2);
  }
  const head = arg.slice(0, eq);
  const colon = head.indexOf(':');
  const name = colon < 0 ? head : head.slice(0, colon);
  const asked = colon < 0 ? '' : head.slice(colon + 1);
  let count = /^[0-9]+$/.test(asked) ? Number(asked) : 1;
  if (count < 1) count = 1;

  let cards = [];
  for (const part of arg.slice(eq + 1).split('|')) {
    let card = part.trim();
    let weight = 1;
    const star = card.lastIndexOf('*');
    if (star >= 0) {
      const tail = card.slice(star + 1).trim();
      if (/^[0-9]+$/.test(tail)) { weight = Number(tail); card = card.slice(0, star).trim(); }
    }
    if (card && weight > 0) cards.push({ card, weight });
  }
  if (cards.length === 0) {
    console.error(`roll: the group "${name}" has no cards left`);
    process.exit(2);
  }
  count = Math.min(count, cards.length);

  const picked = [];
  while (picked.length < count) {
    const total = cards.reduce((sum, c) => sum + c.weight, 0);
    let at = randomInt(total);
    let i = 0;
    while (i < cards.length - 1 && at >= cards[i].weight) { at -= cards[i].weight; i++; }
    picked.push(cards[i].card);
    cards = cards.filter((_, j) => j !== i);  // draw without replacement
  }
  lines.push(`${name}: ${picked.join(' + ')}`);
}
console.log(lines.join('\n'));
