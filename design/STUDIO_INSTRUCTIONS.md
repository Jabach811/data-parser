# Studio Instructions

The Studio is for visual polish and alternate looks for the Workbook Ingestion Console.

## Working rule

Treat `../Main File.html` as the live product. The Studio can hold directions, references, experiments, and notes, but it should not become a second app unless that is explicitly requested.

## Good Studio requests

- Give the app a cleaner command-center look.
- Try a brighter theme.
- Polish the mapping validation panel.
- Improve spacing, hierarchy, typography, colors, or controls.
- Save the visual direction so we can reuse it later.

## Guardrails

- Preserve current app behavior unless the request explicitly changes it.
- Keep design changes scoped and reversible.
- Record major visual decisions in `history/`.
- If a design pass touches risky shared CSS, make a short note explaining what selectors changed.
- Do not rewrite validator logic, workbook parsing, import/export behavior, or provider handling from this folder's workflow.

## Note format

Each history note should capture:

- Goal.
- Visual direction.
- Files touched.
- Important selectors or components.
- What stayed unchanged.
- Verification done.
- Follow-up ideas.
