# Workbook Console Refresh — Handoff

Cleanup/refactor pass on the Vendor Data Parser before new providers and extractions get added.
Owner is a designer first, coder second — explain decisions in plain English, no jargon.

## Files

- **`../Workbook Console - Source.html`** — THE working file. Edit this one. It was unpacked from
  the bundled copy on 2026-07-04 and verified working (loads clean, all 10 sources render, fonts
  inlined as data URIs). ~20,000 lines, single-file app, no build step, no framework. Keep it that way.
- `../Workbook Console.html` — bundler output (code base64-packed inside a loader). Treat as
  read-only dist artifact. Do not edit; it can be regenerated later if needed.
- `../archive/` and `../archive/app-versions/` — historical snapshots. Reference only.
- `test-fixtures/`, `test-upload-files/`, `outputs/` (this folder) — sample inputs and prior outputs
  for verification.
- `../mapping.xlsx`, `../export template.xlsx` — mapping workbook and export shape reference.

Before touching anything, snapshot the source file into `../archive/app-versions/` following the
existing naming convention (`... - before-<change>-<date>.html`), or `git init` the folder and
commit — either is fine, but have a rollback point.

## What the app does

Parses fixed-width / text extract files from retirement-plan recordkeepers (Newport, Fidelity,
Voya, Paychex, OneAmerica, Vanguard, Empower, ADP, Nationwide, Principal), shows totals and
validation, compares against a mapping workbook, and exports a multi-tab XLSX (hand-built XML, no
library). Sources are defined in a `CONFIG` object (~line 9939) with per-report field layouts
(start/length/type) — that data-driven shape is good; keep it.

Line numbers below refer to `Workbook Console - Source.html` as of this writing.

## Goals, in order

### 1. One block per source (highest value)

Adding a provider currently means editing ~6 scattered structures, and nothing warns you if you
miss one:

- `CONFIG` entry (layouts, reports) — ~9939, plus builder functions like
  `buildPaychexSourceConfig()` wired in around lines 12376–13655
- `SOURCE_CARD_META` (accent colors, icon SVG, note) — ~9700
- Separate maps for file-accept types and picker help text — ~9798–9938
- Hardcoded special cases: `source.key === "FIDELITY"` (~13697), `"PRINCIPAL"` /
  `"NEWPORT"` / `"NATIONWIDE"` (~13910–13923), `"EMPOWER"` / `"NATIONWIDE"` in
  `normalizeSummaryCodeForSource` (~16856–16864)

Refactor so everything about one source lives in its single CONFIG entry: card meta, accepted
file extensions, help text, input mode, and any special behavior expressed as config flags or
per-source functions instead of `if key ===` checks in shared code. End state: adding a provider
= adding one self-contained block. Write a short "how to add a source" comment above CONFIG
listing exactly what a block needs.

### 2. Shared text-parsing toolkit (this is the near-term workload)

Paychex (~10639–11346), OneAmerica (~11347–11925), and Vanguard (~11926–12352) each carry
near-identical private copies of: `normalize<X>Date`, `parse<X>Number`, `parse<X>Percent`,
`parse<X>OtherValue`, `build<X>LayoutRows`, `pushGrouped`, and balance/loan text-walking parsers.
Roughly 1,800 lines where maybe a third is genuinely provider-specific.

Extract the common helpers into one shared toolkit that provider configs call, overriding only
what actually differs (date formats, line-matching rules). New text-parsing providers are the
immediate roadmap, so this is the piece that pays off fastest. Verify with the sample files in
`test-upload-files/` — parsed totals and exported workbooks must match byte-for-byte or
value-for-value against a pre-refactor run.

### 3. Deduplicate pop-out window CSS

The mapping-validation pop-out (~14285) and comparison pop-out (~17029) each embed a ~4KB CSS
string that is mostly the same rules twice. Share one base string.

### 4. Principal — leave it, but don't spread it

Principal was a side experiment (workbook/XLSX input instead of text) that never got integrated;
it's why several `key === "PRINCIPAL"` branches exist. Do not remove it and do not build on it
now. When folding special cases into config (goal 1), give Principal an `inputMode: "workbook"`-
style flag rather than key checks, and stop there.

Note for later: Excel-file intake is on the roadmap, and Principal's hand-rolled ZIP/XML reading
(`findEndOfCentralDirectory`, `parseWorksheetRows`, etc. ~14861–15057, shared with mapping
import) is the foundation for it. Structure goal 1 so a future source can declare workbook input
without special-casing — but don't implement Excel intake in this pass.

## Rules

- Pure refactor first: zero behavior change until goals 1–3 are done and verified. Features after.
- Stays one HTML file, vanilla JS, opens by double-click, works offline. No build step, no CDN.
- Verify in a real browser after each goal (serve the folder, load the page, select each source,
  parse a fixture, export, check console for errors) — not just "it looks syntactically fine."
- Match existing code style. No new comments except the "how to add a source" guide.
- Don't regenerate or touch `Workbook Console.html` during this work.
