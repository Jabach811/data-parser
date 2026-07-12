# Garage

Use this folder when the goal is to add a feature, restructure internals, expand validation behavior, or plan changes that affect how the app works.

The live app remains:

- `../Workbook Console - Source refresh.html` (canonical editable source; `../Workbook Console - Source.html` is the prior baseline kept for diffing, and `../Workbook Console.html` is the packed build artifact, not hand-editable)

## What belongs here

- Feature notes.
- Restructure plans.
- Validator expansion specs.
- Risk notes and rollback notes.
- Implementation checklists.
- Before/after behavior summaries.

## What does not belong here

- Pure visual theme exploration.
- Cosmetic-only layout changes.
- Design inspiration or polish-only notes.

Use `../design` for Studio work.

## Suggested flow

1. Start a dated garage note with `scripts/new-garage-note.ps1`.
2. Define the target behavior and the current behavior.
3. Identify the app engine area affected.
4. Call out risks before editing.
5. Make focused changes to `../Workbook Console - Source refresh.html`.
6. Record verification and follow-ups in `history/`.
