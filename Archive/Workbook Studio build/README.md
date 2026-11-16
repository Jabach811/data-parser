# Workbook Studio

This is the focused working copy of the Excel-inspired concept. `Workbook Studio - Demo.html` opens with the fictional Fidelity case. `Workbook Studio.html` opens empty for your own files.

The first pass updates the ribbon and buttons: grouped commands, a persistent export button, a task-pane toggle, a collapsible ribbon, and compact case fields above the table. Existing parsing, report and export handlers remain in use.

The icon pass uses Microsoft Fluent SVGs for the ribbon and Settings. Main commands use color; smaller utility controls inherit the current theme. The mapping upload badge is adapted from the Fluent document icons. Icons are embedded in both HTML files, with no external icon dependency. Sources are recorded in `ribbon-icons.json` and the MIT notice in `THIRD-PARTY-NOTICES.txt`. Earlier approved versions are retained under `versions`.

The readability pass increases the main ribbon icons from 27 to 40 pixels, smaller command icons from 18 to 24 pixels, and default ribbon labels from 12 to 15 pixels. Settings now offers Green, Blue, Indigo, Teal, Plum and Graphite with matching light and dark colors, plus Standard, Large and Extra large text. Text preferences apply to the interface and report tables. Comfortable/Compact spacing remains available. Reset appearance changes preferences without clearing the loaded case.

Appearance preferences use the existing `dpc-settings` browser storage entry, extended with `textSize`. Older palette names migrate to the new choices; unreadable settings fall back to defaults. `appearance.js` replaces only the two original settings scripts. This fixes the fixed green title bar, the shared blue dark-mode accent, and the gear click being mistaken for a click outside Settings. Parsing, mapping and export scripts remain byte-for-byte unchanged.

Build with `node build-workbook.cjs`. The builder reads the preserved Workbook Studio concept, replaces its settings scripts, and embeds the local ribbon, appearance styles and icons; it does not modify the original app or earlier concepts. Run `node verify-workbook.cjs` for the working flows and `node verify-appearance.cjs` for color, contrast, text-size, persistence and layout checks.

Visual direction: retain Segoe UI, Excel green (#107c41), white (#ffffff), soft gray (#fafafa), ink (#242424), and light rules (#e0e0e0). Use small consistent buttons, labelled command groups, and quiet hover states. The ribbon contains only commands the app already supports. No simulated formula input.

Layout: title bar / ribbon tabs + persistent export / command groups / compact case strip + task pane / report table / sheet tabs. The command groups can collapse while Export and the task-pane toggle remain available.
