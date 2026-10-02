# The system map: one format for any input

A design system arrives in whatever form its owners kept it: a `tokens.css`, a Tailwind config,
JSON tokens, Figma variables, a `DESIGN.md` in prose, component CSS, a screenshot. Before a
component is varied inside it (`system.md`, "Variants inside a system"), the input is turned into
one file, `system.map.json`, in the format below. A model that has read only this file can write it
from any of those inputs, and `scripts/tokens-lint.mjs` reads it to check a variant.

The map is a record of what the system *says*. It never improves it: a missing token stays
missing, and the variant proposes its own (`proposed`, below).

## The format

A JSON object with `groups`, and optionally `system` (a name) and `rules`.

- **`groups`** holds up to eight groups, named `color`, `type`, `space`, `radius`, `depth`,
  `motion`, `density`, `breakpoint`. A group the system has nothing for is left out, not emptied.
- **A group** has a `source` and `roles`. The source says where its values came from, and is one of
  `file:<path>` (tokens written as tokens), `prose:<path>` (read out of a document),
  `extracted:<path>` (lifted from component CSS or a config that is not a tokens file) or
  `screenshot` (measured off a picture).
- **`roles`** maps a role name (what the value does: `text-primary`, `ground`, `3`, `overlay`) to
  `{ "var", "value" }`. `var` is the CSS custom property the value is written as
  (`--color-text-primary`): the system's own name when it has one, otherwise the name the variant
  will declare, in the system's naming style. `value` is the value as a CSS string. A colour that
  differs in the dark theme adds `"dark"`. A `breakpoint` role has only `value`, because a media
  query cannot read a custom property.
- **`rules`** (optional) is a list of sentences the system fixes that are not values: the focus
  ring, the least target, how a selected row looks, what a state is never carried by. A variant
  keeps every one.

What each group holds: `color` ground, surfaces, text roles, lines, action, status; `type`
families and the size scale (weights and line heights when the system names them); `space` the
ladder of distances; `radius` the vocabulary; `depth` shadows and layers; `motion` durations and
easings; `density` row heights and paddings per density; `breakpoint` the widths.

## Reading the input

- **Tokens as a file** (`tokens.css`, JSON, a Tailwind theme, Figma variables exported to JSON):
  copy every token into its group by what it does, never by what it is called; `source` is
  `file:`. A list of families becomes one comma-separated string; a nested name (`ink.DEFAULT`,
  `ink.soft`) becomes one role each. A Tailwind scale (`blue-500`, `p-4`) becomes roles under the group it scales, and its
  `var` is the property you will declare (`--color-blue-500`); say so in the note, because the
  system itself has none.
- **Prose** (`DESIGN.md`, a brand guide): take only values written as values ("ground #f6f5f1",
  "8px grid"), `source` is `prose:`. A rule written as a sentence goes to `rules`, a value the
  prose implies but does not state is left out.
- **Existing components**: read the CSS the components share; a value used by many is a token the
  system never named, `source` is `extracted:`.
- **A screenshot**: measure what is plainly there, the page ground, text colour, one action colour,
  the row height, the radius, and nothing more; `source` is `screenshot`.

A map read from prose or a picture is a claim (`frame.md` §2): its values are what was read, not
what is true. Say in the closing note which groups are claims, and let the person correct them;
`tokens-lint` repeats it in its output. When two inputs disagree, the file wins over the prose, and
the disagreement goes in the note.

## A variant's extension

A variant that needs a value the system has no token for, for example a duration when the system
has no motion group, declares it in a second file, `variant.map.json`, with a `proposed` list, and
uses it by name:

```json
{ "proposed": [ { "var": "--motion-settle", "value": "140ms",
                  "reason": "the system has no motion tokens; an arrival settles in 140ms",
                  "group": "motion" } ] }
```

Each entry has `var`, `value` and `reason`; `group` is the group it would join. The variant's CSS
declares the property in its `:root` and uses it as `var(--motion-settle)`. A proposal is for what
the system lacks: a token for a colour the system has, differing by a shade, is not a proposal,
it is a forbidden literal under another name.

## A full example

A small system read from a `tokens.css`, shortened.

```json
{
  "system": "Ledger",
  "groups": {
    "color": { "source": "file:tokens.css", "roles": {
      "ground":       { "var": "--color-ground", "value": "#f6f5f1", "dark": "#14171b" },
      "text-primary": { "var": "--color-text-primary", "value": "#1b1f24", "dark": "#e6e9ee" },
      "action":       { "var": "--color-action", "value": "#1e4fd8" } } },
    "type": { "source": "file:tokens.css", "roles": {
      "body":      { "var": "--font-body", "value": "\"Source Sans 3\", system-ui, sans-serif" },
      "size-body": { "var": "--text-md", "value": "0.875rem" } } },
    "space":  { "source": "file:tokens.css", "roles": {
      "2": { "var": "--space-2", "value": "8px" }, "4": { "var": "--space-4", "value": "16px" } } },
    "radius": { "source": "prose:DESIGN.md", "roles": { "medium": { "var": "--radius-2", "value": "4px" } } },
    "depth":  { "source": "file:tokens.css", "roles": {
      "overlay": { "var": "--shadow-overlay", "value": "0 4px 16px rgb(27 31 36 / 0.16)" } } },
    "density": { "source": "extracted:table.css", "roles": {
      "row-compact": { "var": "--row-compact", "value": "28px" } } },
    "breakpoint": { "source": "file:tokens.css", "roles": { "narrow": { "value": "640px" } } }
  },
  "rules": [ "Focus is a 2px ring of var(--color-action), offset 2px, on every surface.",
             "No target under 24px; a selected row is marked by a bar and a word, never by colour alone." ]
}
```

## What a variant may write

Every value in a variant is one of three kinds, and the lint counts each:

- **From the system**: `var(--…)` of a property a map names.
- **Proposed**: `var(--…)` of a property a `proposed` list names.
- **Forbidden**: a colour, a length, a radius, a shadow, a font, a duration or an easing written
  by value (`#1b1f2a`, `13px`, `140ms`, `cubic-bezier(…)`, `"Inter"`), and a custom property
  with a value of its own that no map or proposed list declares.

What stays: the literals no system tokenises. `0`, `100%`, `auto`, `inherit`, `currentColor`,
`transparent`, `1fr` and the other grid fractions, unitless numbers (line height, opacity,
z-index), angles, keywords (`ease-in`, `solid`), `calc()` and `min()` of tokens, a custom property
that only aliases tokens (`--gap: var(--space-2)`), and a 1px hairline as a border or outline
width. A breakpoint in `@media` is checked against the `breakpoint` group when the map has one.
