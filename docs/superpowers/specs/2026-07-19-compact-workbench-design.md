# Compact Workbench Design

## Decision

Build a new sibling version named `Workbook Console - Compact Workbench.html` using the selected **A2 Balanced Compact Workbench** direction. Preserve `Workbook Console - Source refresh.html`, `Workbook Console - Source.html`, and `Workbook Console.html` without modification.

## Product Goal

Turn the current Workbook Console into a modern desktop operations tool: less decorative chrome, tighter spacing, clearer hierarchy, and more useful information above the fold. The redesign must preserve the existing parser, validation, mapping, report, and export behavior.

## Layout

- A 44-pixel application bar contains the product identity, current job context, and global ready/working/error status.
- A 176-pixel left navigation rail contains Configure, Review, Export, and Reports destinations with compact status indicators.
- A flexible main workspace uses a maximum readable width of 1440 pixels and a balanced 8-pixel spacing system.
- Configure presents job details and source files as two compact groups, with the primary Parse action pinned to the workspace header.
- Review presents the grand total and line metrics in a single summary strip, followed by validation and source/fund detail tables.
- Export presents mapping validation and workbook export as the primary workflow. Secondary report exports remain accessible without competing with the primary action.
- Reports uses a dense list/detail layout. Existing report availability, custom report controls, and export actions remain intact.

## Visual System

- Light neutral desktop canvas: `#F4F6F8`.
- White working surfaces: `#FFFFFF`.
- Primary text: `#17202D`; secondary text: `#667085`.
- Hairline borders: `#D9DEE6`; no ornamental double borders.
- Cobalt action color: `#2563EB`; success: `#17803D`; warning: `#B54708`; danger: `#B42318`.
- System-first typography using `Inter`, `Segoe UI`, and `system-ui` fallbacks.
- Radius is restrained at 6 to 8 pixels. Shadows are limited to menus, dialogs, and sticky elements.
- No gradients, glass effects, oversized headings, card flips, shimmer, or decorative motion.
- Motion is limited to 120 to 180 millisecond state transitions and respects `prefers-reduced-motion`.

## Behavior Contract

- Keep the same ten data-source registrations and their parser functions.
- Keep existing element IDs used by JavaScript unless an explicit adapter preserves the same contract.
- Preserve multi-file upload rules, case-number handling, mapping validation, workbook generation, report generation, clear/reset behavior, loading progress, and error messages.
- Preserve the embedded offline runtimes and do not add network dependencies.
- Replace hover-only or flip-only access to operational detail with visible rows, disclosure buttons, or drawers that also work by keyboard.
- Disabled, loading, success, warning, and error states must remain distinguishable without relying on color alone.

## Responsive Contract

- Desktop is the primary target from 1024 pixels upward.
- Between 760 and 1023 pixels, the rail collapses to icons while retaining accessible labels.
- Below 760 pixels, navigation becomes a compact top step bar and form/table regions stack without horizontal page overflow.

## Acceptance Criteria

1. Existing source and publish HTML files remain byte-identical.
2. The new sibling loads locally without console errors or external network access.
3. All ten data sources appear and retain their parser registrations.
4. Configure, Review, Export, and Reports are reachable by mouse and keyboard.
5. Existing parser/export contract tests pass against the new sibling.
6. Representative vendor fixtures parse successfully and mapping validation still distinguishes valid, warning, and invalid states.
7. The interface is materially denser and quieter than the refresh version, with no card-flip dependency or decorative chrome leakage.
8. The layout has no page-level horizontal overflow at 1440, 1024, 768, and 390 CSS pixels.

## Scope Boundaries

- No parser algorithm redesign.
- No change to output workbook schemas.
- No new vendor source.
- No replacement of embedded libraries.
- No changes to the preserved source, refresh, or publish copies.
