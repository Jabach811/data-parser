# Data Parser

An offline, single-file workbook ingestion console for retirement-plan vendor exports. Open the HTML file in a browser, select a vendor, load the vendor's export files, and the app parses, validates, and prepares workbook output — no server or build step required to run it.

## Root console files

- `Workbook Console - Source refresh.html` - canonical editable source. Make all app changes here.
- `Workbook Console - Source.html` - prior baseline kept for diffing against the refresh.
- `Workbook Console.html` - packed build artifact. Not hand-editable; regenerate it rather than editing.

## Folder map

- `garage/` - feature/restructuring notes, plus `scripts/`, `test-fixtures/`, and generated test outputs.
- `docs/` - workspace notes, operator guides, and planning/spec history.
- `design/` - Studio notes and instructions for visual polish or alternate looks.
- `archive/` - superseded app generations (including the old `Main File.html` line) kept for rollback/reference.

## Known limitation

The `garage/scripts/` Node scripts are not all runnable in a fresh clone: the fixture-builder/inspector scripts (`build-*.mjs`, `inspect-export-workbook.mjs`) import an undeclared `@oai/artifact-tool` dependency, and some `test-*.mjs` contract tests still read the removed root `Main File.html` unless pointed at a current console file.
