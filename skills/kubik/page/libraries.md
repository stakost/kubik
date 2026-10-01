# When the brief points at a design system

Some briefs are not asking for a look at all: they are asking for a product to feel like the
platform it lives on. Then the honest move is to use that platform's own system, not to imitate it
by hand and not to invent on top of it.

| The brief reads as | Use | Package |
|---|---|---|
| Microsoft-style enterprise product | Fluent | `@fluentui/react-components`, `@fluentui/web-components` |
| Google-style product | Material 3 | `@material/web` |
| IBM-style analytics or back office | Carbon | `@carbon/react`, `@carbon/styles` |
| An app inside Shopify | Polaris | Polaris web components |
| Atlassian-style work tool | Atlassian Design System | `@atlaskit/*` |
| A tool for developers in the GitHub manner | Primer | `@primer/css`, `@primer/react-brand` |
| A UK public service | GOV.UK Design System | `govuk-frontend` |
| A US public service | USWDS | `uswds` |
| A plain, fast site for a small business | Bootstrap | `bootstrap` |
| A modern product where you own the components | Radix, or shadcn/ui | `@radix-ui/themes`, `shadcn` |

- **A project has one system.** Two in the same tree fight over every default.
- **Install it, do not redraw it.** If the target can take packages, use the official one and its
  tokens. If the target cannot (one static file, a sandbox), say so in your report and build a
  plain page of your own; do not present a hand-made imitation under the system's name.
- **A component library is never shipped in its default state** when the page is meant to have a
  look of its own: change radius, colour, shadow and type to the project's.
- **A named aesthetic is not a system.** Glass, tile grids, brutalism, editorial, dark terminal,
  aurora, kinetic type: there is no official package for any of them. Build them natively, and do
  not label a web imitation of a platform material as the platform's own.
- **Public-sector and accessibility-first briefs** want the system used plainly. This is where the
  dials sit low and the frame matters most.
