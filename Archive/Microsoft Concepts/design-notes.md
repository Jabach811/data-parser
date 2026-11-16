# Five Microsoft-inspired working layouts

All five start from the current `Data Parser App.html`. Original scripts and control IDs are preserved. The added script moves the existing controls into new shells and provides navigation. Each HTML file embeds its styles and layout script.

## Direction

Segoe UI throughout; 14 px body text, 12 px supporting text, 20–28 px page titles. Neutral surfaces (#ffffff, #f5f5f5, #ebebeb), ink (#242424), subtle borders (#d1d1d1), and familiar product accents. Four-pixel spacing steps; small 4–8 px corners; restrained shadow. Outline icons are hand-authored SVGs. Keep the Data Parser name and mark.

- **Workbook Studio** — Excel-inspired green ribbon above a broad table; original report tabs below; a right task pane for files, reports and checks. `title / ribbon / table + task pane / sheet tabs`.
- **Review Inbox** — Outlook-inspired blue title bar, folder navigation, report list and reading pane. `title + search / commands / folders | reports | reading pane`.
- **Team Workspace** — Teams-inspired violet title bar and app rail, report channels and a tabbed case workspace. `title + search / app rail | channels | workspace tabs + content`.
- **Fluent Desktop** — Windows 11-inspired navigation on a soft base layer, rounded content surface, home shortcuts and focused settings-style sections. `title / navigation | home or one selected section`.
- **Insights Desk** — Power BI-inspired compact shell, mode rail, central reconciliation canvas, right data pane and report pages below. `title / commands / mode rail | canvas | data pane / pages`.

These silhouettes were chosen for their different navigation and panel arrangements, not only their colors. Alignment stays left; numbers use tabular spacing. Narrow layouts stack or collapse their side regions without removing controls. Dark mode and compact spacing remain available.

## References

- [Microsoft Fluent typography](https://fluent2.microsoft.design/typography)
- [Microsoft Fluent layout](https://fluent2.microsoft.design/layout)
- [Microsoft Windows app silhouettes](https://learn.microsoft.com/en-us/windows/apps/design/basics/app-silhouette)

## Review

Use the bundled synthetic Fidelity sample for previews. Verify all original scripts are identical, all original control IDs occur once, file parsing and report switching work, mapping feedback appears, and conversion/export previews open. Inspect every layout at desktop and narrow sizes. Preserve the original app and both earlier concept folders.
