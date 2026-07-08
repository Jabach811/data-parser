# Mapping Validator UI Polish — Design Spec

**Date:** 2026-04-21
**Scope:** Visual + interaction polish of the Mapping Validation panel and its surrounding states. No changes to validator logic, data model, or output schema.
**Reference mockups:** `.superpowers/brainstorm/3171-1776792931/content/polish-directions.html`, `direction-b-states.html`

## 1. Goal

Make the mapping validation step feel smooth and visually pleasing while keeping every existing piece of information intact. The current panel works but reads as a dense stack of repeated row blocks; the polished version should let a user identify the verdict in under a second, then drill into details with clear hierarchy.

## 2. Non-goals

- No changes to `validateMappingWorkbook`, `validateMappingSheet`, `validateSourceMappingRows`, `validateFundMappingRows`, `validateSourceInfoRows`, or any of the type predicates.
- No changes to the validation rules themselves (no new checks, no relaxed checks).
- No changes to the upstream rail tile (`setMappingImportContent`) beyond what's strictly needed to coordinate with the panel; the rail's "Import" tile keeps its existing copy and animated loader.
- No new severity levels. Errors and advisories (warnings) remain the only two tiers.

## 3. Visual language

The polished panel adopts the app's existing dark-purple palette and lives in the **Direction B** language from the approved mockup:

- Panel container: vertical gradient `#1f1839 → #15102a`, 14 px radius, 1 px border `rgba(185,169,255,.18)`, no outer shadow.
- Banner across the top, full bleed, 14 px / 18 px padding, gradient by state:
  - **Valid** — `#3d8a4f → #2d6e3c`
  - **Valid w/ advisories** — same green; subtitle carries the advisory count
  - **Invalid** — `#b14d2c → #8a3a1f`
  - **Pending** — `#3a3168 → #2a2350`
- Banner contains: 34 px circular icon badge (check / `!` / animated dots), title (15 px / 700), subtitle (12 px), and a right-aligned action cluster. While pending the cluster is empty (no controls). Otherwise the cluster has two buttons: `Open in window` (left) and a chevron `Collapse` toggle (right). Collapsed state hides the body, leaving only the banner.
- Numeric "tiles" grid: 3 equal columns separated by 1 px purple hairlines; each tile shows uppercase label, big tabular-numeral value (30 px / 800), small sub-line (e.g. "CIT rows"). Error counts colorize the value `#f7b46c`. Pending state uses skeleton shimmer.
- Sections below the tiles: 14 px / 18 px padding, separated by 1 px hairline, header is uppercase 11 px label with right-aligned count pill. Pill colors: error `#ef7b50`, warn `#f7b46c`, ok `#9ed4a8`, all on `.18` opacity backgrounds.
- Issue rows: 64 px row-label column (e.g. `Source · 47`), flexible message column, right-aligned uppercase column tag (e.g. `K`). Background `rgba(185,169,255,.04)` with a 2 px left stripe colored by severity.
- Header diagnostics use a chip strip: matched chips neutral, missing chips red-tinted with `not found` suffix.

Typography is the existing system font stack already used in the rail. Tabular numerals (`font-feature-settings: "tnum"`) on every numeric value so column-aligned figures don't shift.

## 4. States

The panel renders one component for all four states; only banner copy, gradients, tile contents, and section visibility change.

### 4.1 Pending
- Banner: animated 3-dot pulse in the icon, title `Validating workbook…`, subtitle `Reading sheets and checking layout`. No action buttons in the cluster — a real cancel control is out of scope (§12) and re-uploading replaces the in-flight state via existing logic.
- Tiles: 3 skeleton bars animating left-to-right, sub-line stays.
- No sections rendered.

### 4.2 Invalid
- Banner: red gradient, `!` icon, title `Validation failed`, subtitle `<N> issues across <M> sheets · fix and re-upload`, right action `Open in window`.
- Tiles: real CIT counts when known; sub-line replaced by `<N> errors` colored amber for any sheet with errors. Source I tile shows row count and `0 errors` when the sub-sheet wasn't located (instead of suppressing the tile).
- Sections, in order, only when the underlying data is non-empty:
  1. **Source headers** / **Fund headers** / **Source I headers** — each as its own section with chip strip
  2. **Row issues** — combined list of all error rows from all three sub-sheets, prefixed `Source · <row>`, `Fund · <row>`, or `Source I · <row>`. Sorted by sheet then row number. Cap at 8 visible with a `+ N more` footer.
  3. **Common causes** — single line of dot-separated tips; collapsed visual weight.

### 4.3 Valid (no advisories)
- Banner: green gradient, check icon, title `Workbook validated`, subtitle `Ready for export`, right action `Open in window`.
- Tiles: real counts, no error coloring.
- No sections rendered.

### 4.4 Valid with advisories
- Same as Valid, but banner subtitle becomes `<N> advisories · ready for export`.
- Single **Advisories** section with amber-stripe rows, capped at 8 with `+ N more`.

## 5. Component structure (DOM + classes)

The HTML produced by `buildMappingPanelHtml` is replaced wholesale by a new builder function (same name, same call sites — the rail keeps invoking it with the same `mappingState` argument). The new class namespace is `mvp-` (Mapping Validation Panel) so it doesn't collide with the existing `mp-*` styles, which are removed in the same change.

```
.mvp-panel
  .mvp-banner.is-{pending|invalid|valid|valid-warn}
    .mvp-banner-icon
    .mvp-banner-text
      .mvp-banner-title
      .mvp-banner-sub
    .mvp-banner-actions
      .mvp-open-window  (button, hidden while pending)
      .mvp-toggle       (button, hidden while pending)
  .mvp-tiles
    .mvp-tile
      .mvp-tile-lbl
      .mvp-tile-val[.is-err|.is-skel]
      .mvp-tile-sub
  .mvp-section
    .mvp-section-head
      .mvp-section-title
      .mvp-pill[.is-err|.is-warn|.is-ok]
    .mvp-chips     (header sections)
      .mvp-chip[.is-miss]
    .mvp-rows      (row-issue sections)
      .mvp-row[.is-err|.is-warn]
        .mvp-row-label
        .mvp-row-msg
        .mvp-row-tag
    .mvp-more
```

The collapsible behavior (`is-collapsed`) is preserved. `toggleMappingPanel` and `closeMappingPanel` keep their current logic but match on `.mvp-toggle` in addition to (or instead of) `.mp-toggle`. The popout window keeps working because it serializes the panel's `outerHTML` and the surrounding stylesheet; only the class names change.

## 6. Motion

Keep motion minimal and purposeful:

- **Banner state change**: 180 ms cross-fade of the banner's gradient + icon swap. Nothing animates the tiles or sections — they just appear when content arrives.
- **Pending shimmer**: 3-dot pulse, 1.2 s loop. Tile skeletons use a 1.4 s left-to-right gradient sweep.
- **Section reveal**: when the panel transitions from pending to valid/invalid, sections fade in with a 120 ms stagger (0 ms, 60 ms, 120 ms). No height animation — the panel is allowed to grow instantly.
- **Reduced motion**: respect `@media (prefers-reduced-motion: reduce)` — disable shimmer and stagger; banner change becomes an instant swap.

## 7. Copy

| Slot | Pending | Invalid | Valid | Valid w/ advisories |
|---|---|---|---|---|
| Title | Validating workbook… | Validation failed | Workbook validated | Workbook validated |
| Subtitle | Reading sheets and checking layout | `<N> issues across <M> sheets · fix and re-upload` | Ready for export | `<N> advisories · ready for export` |
| Actions | (none) | Open in window · Collapse | Open in window · Collapse | Open in window · Collapse |

Section titles: `Source headers`, `Fund headers`, `Source I headers`, `Row issues`, `Advisories`, `Common causes`.

Row label format: `<Sheet> · <RowNumber>` (e.g. `Source · 47`). Tag is the column letter alone (e.g. `K`), uppercase, monospaced.

## 8. Popout window

The popout (`getMappingPopoutDocumentHtml`, `openMappingPopoutWindow`) keeps its current scaling overrides but switches to the `mvp-*` class names. The popout-only sizing (banner 27 px title, tile values 42 px, etc.) is recalibrated against the new component:

- Banner title 24 px, subtitle 14 px
- Tile value 44 px, label 12 px, sub-line 13 px
- Section title 13 px, row-label / row-msg 14 px, row-tag 12 px

Comparison status / summary / results sections that already share the popout window remain unchanged.

## 9. Affected code

Single file: `Main File.html`.

| Concern | Location | Change |
|---|---|---|
| Panel HTML builder | `buildMappingPanelHtml` (~ line 11045) | Rewrite output to the `mvp-*` structure above. Same input shape, same return type (string). |
| Builder alias | `buildMappingTroubleshootHtml` (~ line 11243) | Keep as a one-line alias. |
| Rail integration | `setMappingImportContent` (~ line 11305), `updateExportRailState` (~ line 11337) | Unchanged behavior; only verify the panel `is-open` toggling still applies. |
| Toggle / close handlers | `toggleMappingPanel`, `closeMappingPanel` (~ line 11391) | Unchanged. |
| Popout HTML | `getMappingPopoutDocumentHtml` (~ line 11247) | Update the `body.mapping-popout-mode` overrides to target `mvp-*` classes with the sizes in §8. |
| CSS | `.mp-*` rules (~ lines 518, 633–733) | Replace block with `mvp-*` rules. Drop unused `.mp-stat`, `.mp-sheet-cit-val.has-errors` classes. |

No JavaScript control flow changes outside the builder rewrite. No new external dependencies.

## 10. Accessibility

- The banner's icon badge is `aria-hidden`; status is conveyed by the title text.
- The `Cancel` and `Open in window` buttons are real `<button>` elements with `aria-label`s describing their action.
- Color is not the only signal: error / warn / ok rows always carry an explicit text label or count, and the row-tag column repeats the column letter.
- Skeleton tiles announce `aria-busy="true"` on the tile container during pending; the banner carries `role="status"` so screen readers announce verdict changes.
- All text on dark gradients meets WCAG AA against the panel background; chip and pill colors are checked individually.

## 11. Testing

Manual verification only — there's no test suite in this single-file app.

1. Upload a known-good mapping workbook → pending → valid (no advisories). Confirm banner sequence, tile counts match the prior `mp-*` values, popout opens identical content.
2. Upload a workbook missing the `K · SRC I` header → invalid → confirm Source headers section shows the missing chip.
3. Upload a workbook with three CIT rows that fail rules (bad `L`, bad `Q`, bad `K`) → invalid → confirm Row issues section lists all three with correct `Sheet · row` labels.
4. Upload a workbook that validates with two advisories (blank `K` on a CIT row, missing `P`) → valid w/ advisories → confirm Advisories section shows two amber rows.
5. Re-upload while pending — confirm a fresh upload replaces the in-flight state cleanly (no leftover skeleton, banner returns to the new file's verdict).
6. Toggle reduced motion in OS prefs → reload → confirm no shimmer, no stagger.
7. Open popout window → confirm scaled typography matches §8.

## 12. Out of scope, parked for follow-ups

- Restructuring the validator code itself (duplication across the three row validators, magic column indexes, three overlapping return shapes).
- A real cancel handler for in-flight validation.
- Inline "fix-it" actions on issue rows (e.g. "open this row in Excel").
- Telemetry on which advisory codes show up most often.
