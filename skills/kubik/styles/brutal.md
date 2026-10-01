# Brutal: the printed sheet and the live terminal

Interfaces that look engineered rather than styled: a sheet from a machine manual, a declassified
file, a terminal left running in a hangar. Letterforms the size of buildings beside labels the size
of a serial plate. Visible grid lines, ink on paper, one hazard red, corners at exactly ninety
degrees, and a layer of analogue wear so none of it looks freshly rendered. It should feel heavy.

**Read before any code, both required:** `method.md` (how to work here) and `frame.md` (the frame
every piece stands in).

## What makes it this style

- **One mode, held throughout.** *The printed sheet*: newsprint ground, carbon ink, heavy
  grotesque, light. Or *the live terminal*: a dead CRT, white phosphor, monospace everywhere,
  dark. One inverted block (a terminal on a paper page, a printed label on a dark
  one) is allowed as an accent.
- **Monumental against microscopic.** Uppercase display type at architectural scale against small
  tracked monospace labels. The contrast of scale is the composition.
- **A visible structure.** Everything sits on grid tracks drawn with solid lines. Zero radius.
- **Ink, paper, red.** No soft gradients, no soft shadows, no translucency. One accent.
- **Wear.** Grain, halftone, scanlines, misregistration: the page has been printed or has been on
  for years.

## The shelves

**Substrate and ink.** Print: `#F4F4F0` or `#EAE8E3` with `#050505` to `#111111`. Telemetry:
`#0A0A0A` or `#121212` with `#EAEAEA`. Or a relative of these: kraft, blueprint cyan on navy,
microfilm green-grey, amber monitor.

**The accent.** Hazard red, `#E61919` or `#FF2A2A`: bars, blocks, strike lines, one giant glyph,
the single datum that matters. Terminal green `#4AF626` for exactly one readout on the dark
mode. Red set as small text needs its darker sibling to be readable (`#C41414` on paper,
`#FF4545` on black).

**Macro type.** Archivo Black, Archivo at its widest and heaviest, Anton, Bebas Neue, Big Shoulders
Display, Unbounded, Inter Tight Black; Neue Haas Grotesk Black or Monument Extended when licensed.
Uppercase, tracking `-0.03em` to `-0.06em`, line-height 0.85 to 0.95, fluid up to
`clamp(4rem, 14vw, 17rem)`. Let it bleed off the viewport, crop it, stack it, rotate it ninety
degrees, run one word the full width.

**Micro type.** IBM Plex Mono, JetBrains Mono, Courier Prime, Space Mono, VT323. Uppercase,
tracking `0.05em` to `0.1em`, 12 to 14px. Running sentences drop to sentence case so they can be
read.

**A serif, once.** Playfair Display, EB Garamond, Times: one word or one giant glyph as textural
contrast, halftoned or dithered when it is an ornament.

**Symbols and devices.** ASCII frames (`[ UNIT ]`, `< RE-IND >`, `>>>`, `///`). Crosshairs at grid
intersections. Barcodes and code strips. Hazard stripes. Registration and crop marks. A title block
like an engineering drawing's, with sheet number, revision and scale. Giant numerals. Redaction
bars. Stamps (`APPROVED`, `VOID`). Spec tables with ruled rows. Exploded diagrams with callout
lines. Punch-card rows. Ticker tape. Status lamps. A strike-through in red over something the page
denies.

**Texture.** Global grain on a fixed layer. Halftone and one-bit dither on images and ornament.
CRT scanlines, phosphor bloom and a slight curvature on the dark mode. Misregistered ink: a
red plate offset two pixels from the black. Photocopy streaks.

**Motion.** Mechanical, never smooth. `steps()` easing. A typewriter line. A blinking block cursor.
A counter rolling to its value. A scan line sweeping a panel. Tape running sideways. Hard cuts on
hover: invert the cell, no fade. A readout that ticks.

**Layout.** `display: grid; gap: 1px` over a contrasting parent draws perfect hairlines. Dense
clusters of data beside great fields of empty substrate. Use the precise element where it is true:
`<table>`, `<dl>`, `<kbd>`, `<samp>`, `<data>`, `<output>`.

**Compositions.** A poster. A spec sheet. A title block. A blueprint. A terminal session. A
two-page manual spread. A shipping label. A dossier cover.

## Throw the dice

```
bash <kubik>/scripts/roll.sh \
  macro="Archivo Black|Archivo widest heaviest|Anton|Bebas Neue|Big Shoulders Display|Unbounded|Inter Tight Black" \
  mono="IBM Plex Mono|JetBrains Mono|Courier Prime|Space Mono|VT323" \
  composition="poster|spec sheet|engineering title block|blueprint|terminal session|manual spread|shipping label|dossier cover" \
  device:3="ASCII frames|crosshairs|barcode strip|hazard stripes|registration marks|giant numerals|redaction bars|stamp|exploded diagram with callouts|punch-card rows|ticker tape|status lamps|rotated side text" \
  texture:2="grain|halftone|one-bit dither|scanlines|misregistered red plate|photocopy streaks" \
  motion="typewriter line|rolling counter|scan sweep|running tape|hard-cut hover invert|blinking cursor"
```

Choose the mode from the brief, not from the roll: paper for an editorial or a manual, phosphor
for a console or a data product.

## Where this style goes wrong

- **Timid scale.** If the largest type is under a fifth of the viewport width, it is a tidy page
  with a mono font, not brutalism.
- **Ornament passed off as fact.** Sheet numbers and grid references can be invented; a version, a
  count or a date about the product cannot, and `®` means registered.
- **The words pay for the texture.** Halftone the ornament, not the sentence; grain goes under the
  text or stays faint; red under 24px uses the darker red.
- **Strike-through on a claim the sentence makes** reads as its opposite. Strike only what is
  denied.
- **The phone gets a pile of rows.** Keep short cells two across, keep numerals beside their
  titles, keep the section index reachable, and let the macro type stay enormous there too.
