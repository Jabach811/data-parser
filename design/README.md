# Design Studio

Use this folder when the goal is to polish the app, explore a different look, test layout directions, or document visual instructions for future styling passes.

The live app remains:

- `../Workbook Console - Source refresh.html` (canonical editable source; `../Workbook Console - Source.html` is the prior baseline kept for diffing, and `../Workbook Console.html` is the packed build artifact, not hand-editable)

## What belongs here

- Visual direction notes.
- Theme or layout experiments.
- Before/after observations.
- Prompts, instructions, and decisions from previous design passes.
- Screenshots or reference assets, if needed later.

## What does not belong here

- Feature architecture changes.
- Validation rule changes.
- Data model restructuring.
- Permanent app backups.

Use `../garage` for feature and structure work.

## Suggested flow

1. Start a dated design note with `scripts/new-design-note.ps1`.
2. Write the desired look, constraints, and what should stay unchanged.
3. Make a copy or snapshot only when the design pass is risky.
4. Apply the polish to `../Workbook Console - Source refresh.html`.
5. Save final notes in `history/` so older instructions can be reused or reversed later.
