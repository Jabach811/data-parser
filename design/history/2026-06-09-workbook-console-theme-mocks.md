# Workbook Console Theme Mocks

## Goal

Explore a shorter hero and a wider visual range for `Main File.html` without changing the live parser.

## Visual Direction

- Apple: light, calm, system-app feel with soft panels and blue primary actions.
- Cursor: dark, editor-native console feel with dense status language and green success accents.
- Vercel: crisp black/white infrastructure feel with grid texture, minimal color, and strong borders.

## Files Touched

- `docs/design-explorations/workbook-console-theme-mocks.html`

## Important Selectors

- `.app-hero` replaces the current oversized hero idea with a compact command header.
- `.workspace` keeps the existing Configure, Review, Export, Source, and Reports mental model.
- `.apple`, `.cursor`, and `.vercel` scope the three visual themes.

## What Stayed Unchanged

- `../Main File.html` was not edited.
- Workbook parsing, validation, export logic, provider handling, and mapping behavior were not touched.

## Verification Done

- Confirmed the live app file was unchanged.
- Confirmed all three mock panels and theme tabs exist.
- Confirmed compact hero CSS is present and old giant-hero values were not copied into the mock.
- Browser render was attempted through the local Node REPL, but the REPL exited with a sandbox setup error before Playwright launched.

## Follow-Up Ideas

- Pick one direction, then apply it to a copy of `Main File.html` before touching the live app.
- If the Cursor or Vercel look wins, preserve the compact export rail as the main operational pattern.
- The current live hero can likely shrink from a large promotional block into a 90-120px command header without hurting the workflow.
