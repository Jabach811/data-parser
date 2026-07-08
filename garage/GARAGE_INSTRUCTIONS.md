# Garage Instructions

The Garage is for functional changes and structural work on the Workbook Ingestion Console.

## Working rule

Treat `../Main File.html` as the live product. Garage notes should make feature work safer by capturing intent, affected code areas, and verification steps before changes scatter across the single-file app.

## Good Garage requests

- Add a new validation rule.
- Expand the mapping validator.
- Refactor a repeated helper.
- Add a new provider workflow.
- Restructure a panel or state flow.
- Build a safer path for future automation.

## Guardrails

- Preserve known-good behavior unless the request explicitly changes it.
- Prefer small, testable changes over broad rewrites.
- Keep rule definitions close to the validator engine unless there is a clear reason to centralize them.
- If a feature touches parsing, validation, export, or saved state, document the downstream impact.
- Record verification clearly. If browser or workbook testing was not done, say so.

## Note format

Each history note should capture:

- Goal.
- Current behavior.
- Desired behavior.
- Affected engine area.
- Risks and edge cases.
- Files touched.
- Verification done.
- Follow-up ideas.
