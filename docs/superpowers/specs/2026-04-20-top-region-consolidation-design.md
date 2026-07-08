# Top Region Consolidation — Design Spec

**Date:** 2026-04-20
**File:** `Main File.html` (Principal Workbook Console)
**Scope:** Restructure the top three columns of the workspace grid. Remove the separate Balance Summary panel. Unify the visual palette of the moved components.

## Problem

The top region of the console currently splits user-facing work across four panels that feel uneven:

1. **Setup (01)** — data source, case #, plan name
2. **Input (02)** — file/folder picker, loading/progress box, parse-complete counters
3. **Export (03)** — mapping upload, comparison status, export button
4. **Balance Summary** (row 2, right half) — Grand Total, Participants, Source Totals (flip), Fund Totals (flip)

Two issues:

- **Fragmented parse feedback.** Balance summaries sit below the parse counters in a separate panel, forcing the user to scan across rows to understand a single parse.
- **Visual inconsistency.** The Setup and Input panels use the warm linen palette (ivory/orange); the Balance Summary and several inner components (`.mini-stat`, `.breakdown-box`, `.comparison-status`, `.rail-btn.primary`, `.source-action`) use Apple-style grays (`#f5f5f7`, `#1d1d1f`) and blue (`#0071e3`, `#0066cc`). Reads as two design systems in one app.

## Goal

Consolidate the top region into three coherent columns where each column has a single job, the parse feedback lives in one place, and the palette is unified.

## Target Layout

### Column 01 — Setup · Configure & Load

Absorbs the file/folder input block and the loading progress box from the current Input panel.

Vertical order:

1. Step head: badge `01`, tag `Setup`, title `Configure & Load`, description "Pick the source, enter plan details, load your file."
2. Data Source card (existing `.source-card-select`, unchanged)
3. Field row: Case Number + Plan Name (existing, unchanged)
4. Input mode note (`#inputModeNote`) — moved from Input panel
5. File picker (`#fileInputBlock`) — moved from Input panel
6. Folder picker (`#folderInputBlock`, hidden by default) — moved from Input panel
7. Loading box (`#loadingBox`) — **split**: only the head + track + note move here. The `parse-complete-shell` (Total/Accepted/Discarded flip card) moves to column 02.
8. Error text (`#errorText`) — moved from Input panel (stays near the picker/progress so parse errors appear next to the action that caused them)

### Column 02 — Results · Parse Summary

Replaces the current Input panel's identity. Absorbs content from the old Balance Summary panel plus the parse-complete metrics from the old Input panel.

Vertical order:

1. Step head: badge `02`, tag `Results`, title `Parse Summary`, description "Totals and counters from the current parse."
2. Grand Total / Participants — 2-column mini-stat grid (moved from Balance Summary)
3. Source Totals flip card (moved from Balance Summary)
4. Fund Totals flip card (moved from Balance Summary)
5. Parse-complete metrics: Total / Accepted / Discarded (moved from the Input loading box; kept as a 3-column metric grid)
6. Summary validation panel (`#summaryValidationPanel`) — moved from Input panel

### Column 03 — Mapping & Export

Structurally unchanged. Visual-only updates:

- Primary button background shifts from `#0071e3` → `var(--accent)` (`#f54e00`) for palette consistency.
- Secondary/loaded rail-button states already use linen tones; confirm they remain consistent.
- `.source-action` links shift from Apple blue to the accent orange.

### Row 2 — Report List + Export extension

- Report List panel keeps its current 2-column width on row 2.
- The Export column (grid-area `export`) extends to span **rows 1 and 2**, column 3. This replaces the old Balance Summary slot with vertical room for the Export rail to breathe.
- When the mapping workbook loads later, `#mappingValidationPanel` and the comparison results (both already children of the Export rail) will expand vertically into that additional room. This change only reserves the space — no new behavior is introduced here.

## Grid Changes

### Before (workspace grid)

```css
grid-template-columns: minmax(0,1.02fr) minmax(0,1.1fr) minmax(0,1fr);
grid-template-areas:
  "setup input export"
  "list  list  totals"
  "reports reports reports";
```

### After

```css
grid-template-columns: minmax(0,1.02fr) minmax(0,1.1fr) minmax(0,1fr);
grid-template-areas:
  "setup results export"
  "list  list    export"
  "reports reports reports";
```

- `input-panel` renames to `results-panel` (grid-area `results`). Keeps column 02's width.
- `breakdown-panel` is removed from the DOM.
- The `export` grid area now spans rows 1 and 2 of column 3. The Export rail (`.export-rail`) becomes taller; its existing `flex-direction:column` stack naturally absorbs the extra height. The mapping validation panel and comparison results (already children of the rail) will have room to expand when loaded.
- At `max-width:1200px` the grid collapses to two columns: `setup results / export export / list list / reports reports` (Export goes full-width on its own row). At `max-width:760px` everything stacks in a single column in this order: setup → results → export → list → reports.

## Visual / Palette Consolidation

The moved and restyled components must adopt the warm linen tokens already defined on `:root`:

| Component | Before | After |
|---|---|---|
| `.mini-stat` (Grand Total / Participants) | `#f5f5f7` bg, `#1d1d1f` text, `#6e6e73` label | `rgba(255,253,249,.9)` bg with `rgba(38,37,30,.08)` border, `var(--text)` number, `var(--muted)` label, `var(--font-mono)` label, `var(--font-display)` 900-weight number to match step-head typography |
| `.breakdown-box` / flip cards | White bg, Apple-gray labels | `rgba(255,253,249,.95)` bg with `rgba(38,37,30,.08)` border, same typographic scale as `.mini-stat` |
| `.breakdown-row` / `.breakdown-key-chip` / `.breakdown-value` | Apple-gray chips | Linen chips with `var(--line)` borders and `var(--accent)` highlight for the row key |
| `.rail-btn.primary` | `#0071e3` blue | `var(--accent)` orange (`#f54e00`), white text preserved |
| `.source-action` (Clear Custom Reports) | `#0066cc` blue border/text | `var(--accent)` orange border/text; hover fills orange |
| `.comparison-status` / `.comparison-summary` | Apple-gray bg, `#1d1d1f` text | Linen tokens (`var(--iv-500)` / `var(--text-soft)`) |
| `.mp-panel` child tokens | Mixed | Already uses linen tokens; confirm no regressions |

The flip-card hover behavior is preserved for Source Totals and Fund Totals.

## Step Numbering

Keep the `01 / 02 / 03` badges. The meaning shifts slightly:

- `01` = Setup (now includes file load)
- `02` = Results (was Input; now read-only feedback)
- `03` = Export

The workflow still reads left-to-right as a three-step process.

## Behavioral Notes

No JavaScript logic changes are required for the restructure itself — all existing element IDs (`#fileInput`, `#folderInput`, `#loadingBox`, `#loadingFill`, `#loadingPercent`, `#totalLinesText`, `#acceptedLinesText`, `#discardedLinesText`, `#grandTotalText`, `#participantCountText`, `#sourceBreakdownText`, `#fundBreakdownText`, `#errorText`, `#summaryValidationPanel`, etc.) remain in place. Only their DOM parent changes.

One structural JS-adjacent detail: the existing `loadingBox` element contains `parse-complete-shell` as a descendant. To move `parse-complete-shell` to column 02 without breaking the flip-card logic, that subtree must be lifted to a sibling position inside `#resultsPanel`. Confirm no selectors reference `#loadingBox .parse-complete-*` — if any do, update them to select by ID directly.

The empty-state copy on the Setup panel's input area should match today's ("Standard file mode is active. Choose a text file to parse."), and the Results panel should show the existing empty-state placeholders for breakdown/flip cards ("No data yet.") until a parse completes.

## Out of Scope

- Mapping panel expansion behavior (the extended Export rail height is reserved but no new validation UI is added here).
- Any changes to the hero, Report List content, or Parsed Reports output.
- Engine/parser logic.
- Any new features.

## Success Criteria

1. File picker, folder picker, mode note, loading/progress box, and error text render inside the Setup panel.
2. Grand Total, Participants, Source Totals, Fund Totals, and Total/Accepted/Discarded render inside the Results panel in that vertical order.
3. Old `.breakdown-panel` is removed from the DOM; the `export` grid area spans rows 1 and 2 of column 3.
4. All moved components use the warm linen palette tokens; no `#f5f5f7`, `#1d1d1f`, `#0071e3`, `#0066cc`, or `rgba(0,0,0,...)` values remain in the restyled selectors.
5. Parse flow end-to-end still works: choosing a file shows the progress bar in Setup, and on completion the Results column populates correctly.
6. Responsive breakpoints at 1200px and 760px collapse cleanly (three → two → one column).
7. No JavaScript console errors on load or during a full parse + export cycle.
