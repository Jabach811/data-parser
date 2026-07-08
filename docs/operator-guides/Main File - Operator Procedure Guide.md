# Workbook Ingestion Console - Operator Procedure Guide

Source file: `C:\Users\mabac\OneDrive\Desktop\Joel's Workspaces\Work - Transamerica\Data Parser\Main File.html`  
Source title: `Principal Workbook Console - Cursor Design`  
App heading: `Workbook Ingestion Console`  
Source last modified: April 29, 2026, 6:12 PM  
Guide created: May 30, 2026  
Format: Standalone browser-based HTML app

## What This Guide Is For

This guide explains how to use the Workbook Ingestion Console to turn provider extract files or extract folders into reviewable report tables and Excel workbook outputs.

Use this when you need to:

- Pick a provider/data source.
- Load a fixed-width text file, extract folder, or Principal workbook folder.
- Review accepted, discarded, source, fund, participant, and balance totals.
- Validate a Source Mapping / Fund Mapping workbook.
- Compare actual parsed codes against mapping codes.
- Export a workbook with report tabs, balance support tabs, mapping-driven output, and CIT election output when available.

The short version: choose the source, load the input, review the parse, upload the mapping workbook if needed, then export.

## Fast Start

1. Open `Main File.html` in a browser.
2. Choose the data source in Step 1.
3. Enter the case number.
4. Enter the plan name if you want it included in the export filename.
5. Load the input:
   - Fidelity uses a single text-style file.
   - Most other sources use folder mode.
   - Principal uses a folder containing the Principal workbook.
6. Review Step 2 for totals, participant count, accepted rows, discarded rows, source totals, and fund totals.
7. Check the Report List and Parsed Reports sections.
8. If you need the Conv File or mapping reconciliation, upload the mapping workbook in Step 3.
9. Review mapping validation results.
10. Export the workbook.

Best simple rule: do not export until the accepted/discarded counts and source/fund totals make sense for the case. The app will build a file, but the operator still owns the sanity check.

## Big-Picture Mental Model

The console has three working steps:

1. Configure and Load  
   This tells the app what kind of input it is reading and gives it the case/plan context.

2. Review Results  
   This shows what the parser accepted, what it discarded, and what totals it reconstructed from the input.

3. Map and Export  
   This validates the mapping workbook, compares actual parsed source/fund codes against the mapping workbook, and generates the Excel output.

The app runs locally in the browser. It reads local files through browser file pickers and downloads a generated `.xlsx` file. It does not appear to send data to a server.

## Supported Data Sources

The app supports these data sources:

| Data source | Input mode | Export support | Notes |
|---|---:|---:|---|
| Fidelity | Single file | Yes | Uses a fixed-width text-style upload. Accepts `.txt`, `.dat`, `.prn`, and `.log` through the file picker. |
| Newport | Folder | Yes | Looks for extract text files and any PDF named with `- Plan Summary Report`. |
| Nationwide | Folder | Yes | Looks for a text extract file and a 5-digit Plan Summary Report PDF. |
| Empower | Folder | Yes | Looks for `d-` data extract files and an `s-` summary file. |
| ADP | Folder | Yes | Looks for an `EXTRAC` data file and a `REPORT` summary file. |
| Voya | Folder | No | Parse/review profile only. Export and breakdown support are disabled in the current file. |
| Paychex | Folder | Yes | Classifies balance extract and loan extract text files automatically. |
| OneAmerica | Folder | Yes | Classifies valuation and loan text files automatically. |
| Vanguard | Folder | Yes | Looks for `ENTJ767` recordkeeping files and `ENTJ768` payroll participant files. |
| Principal | Folder | Yes | Looks for a Principal workbook named like `#-#####` and extracts balances from the Account Value Data tab. |

Nice use: the app adapts the input control after source selection. If the source is folder-based, the normal file picker becomes inactive and the folder picker becomes active.

## Step 1 - Configure and Load

### Data Source

Use the Data Source card to pick the provider/extract type.

What it affects:

- Which parser is used.
- Whether the app expects a single file or a folder.
- Which report codes appear in the Report List.
- Which source/fund/participant summary rules are available.
- Whether export is enabled after parsing.

Be careful with source selection. If you choose the wrong provider, the app may discard almost everything because the record layout does not match.

### Case Number

The case number is required before export.

The app accepts these prefixes:

- `QK`
- `NQ`
- `TA`
- `TE`
- `TG`
- `JK`
- `TO`

The app strips extra spacing while validating, then formats the case number when you blur the field or export. If the prefix or digit count is wrong, export stops and the field shows an error.

Why this matters: the case number is written into generated workbook output and used in the downloaded filename.

### Plan Name

The plan name is optional, but useful.

What it affects:

- The downloaded workbook filename.
- The title/context metadata inside the parse result object.

If the plan name is blank, the export filename falls back to `Plan Name`.

### Select Text File

Use this for single-file sources, currently Fidelity.

Accepted picker types:

- `.txt`
- `.dat`
- `.prn`
- `.log`

What happens after choosing a file:

- The browser reads the file locally.
- The app normalizes line endings.
- The parser scans the input for expected report codes.
- Step 2 updates with counts and totals.
- Parsed Reports render as table cards.

### Select Source Folder

Use this for folder-mode sources.

Folder-mode sources include:

- Newport
- Nationwide
- Empower
- ADP
- Voya
- Paychex
- OneAmerica
- Vanguard
- Principal

What happens after choosing a folder:

- The app receives the files in that selected folder through the browser.
- It reads only matching files based on source-specific naming rules.
- It skips non-matching files.
- It parses matched files and builds report tables.
- It shows skipped or unsupported items in the discarded detail area.

Be careful with folder contents. The app can skip unrelated files, but a cleaner input folder makes the parse easier to audit.

### Loading State

The loading panel shows:

- Current action, such as reading file, parsing folder, or building tables.
- Percent progress when available.
- A status note with the active file/folder behavior.

If a file cannot be opened, the app shows a read failure message.

## Step 2 - Review Results

Step 2 is the operator checkpoint. This is where you decide whether the parse looks trustworthy.

### Grand Total

Grand Total is the reconstructed balance total from the parsed source/fund data.

Use this to compare against provider summary totals or known expected balances. A mismatch here is usually a signal to stop and investigate before export.

### Participants

Participants counts unique participant identifiers based on the selected source's summary rules.

Use this when checking whether the extract size feels right.

### Source Totals

The Source Totals card summarizes balances by source/money type.

Hover or flip the card to see detail when available.

This is useful because source-level mismatches usually affect conversion file setup and downstream reconciliation.

### Fund Totals

The Fund Totals card summarizes balances by fund/investment option.

Hover or flip the card to see detail when available.

This is useful because fund-level totals drive mapping validation and the Conv File output.

### Total, Accepted, and Discarded

The parse summary shows:

- Total: raw lines or source rows considered.
- Accepted: records the app matched to supported report layouts.
- Discarded: records the app skipped, ignored, or could not classify.

Best simple rule: a nonzero discarded count is not automatically bad. It depends why lines were discarded. Open the discarded detail and look at the reason.

### Discarded Line Detail

The discarded detail panel explains what was skipped.

For unexpected report codes, the app may show an `Add Code` button. Clicking it adds that code as a custom report using a fallback layout.

Use `Add Code` when:

- The record code is real.
- You need to preserve visibility into the raw lines.
- A formal layout does not exist yet.

Be careful with `Add Code`: it does not magically know the business meaning of each field. It adds a fallback layout so the rows can be surfaced instead of lost.

### Summary Validation

Some sources include supplemental summaries. When available, the app compares parsed totals to summary totals and shows pass/fail or informational validation.

Important source-specific note: Nationwide source totals may be reconstructed from PDF money-type labels using MONEY TYPE TOTAL lines. The app notes that those labels do not directly match extract source codes, so source-by-source validation may be skipped.

## Report List

The Report List shows all available report codes for the selected source.

Each item shows:

- Report code.
- Report label/name when known.
- Whether the report is standard or custom.
- Row count after parsing.

The `Clear Custom Reports` button removes custom report codes added from discarded detail.

Use this when:

- You added a code by mistake.
- You want to return the source to its standard report set.
- You are rerunning a cleaner parse.

## Parsed Reports

Parsed Reports renders one report card per report code with parsed rows.

Each card can include:

- Report title.
- Row count.
- Preview table.
- `Download Report` button.
- `Show All` / `Show Less` button when the report has more than the preview row limit.

The preview limit is 20 rows. `Show All` expands the table in the browser. It does not change the exported workbook.

### Download Report

`Download Report` exports a workbook for that one report code.

Use this when:

- You need to inspect one report separately.
- You want a smaller handoff file.
- You are debugging one extract section.

Be careful: exporting still requires a valid case number.

## Step 3 - Map and Export

Step 3 is where the parsed actual data meets the mapping workbook.

### Upload Mapping File

Use this to upload the mapping workbook.

The app reads `.xlsx` files locally and validates required workbook tabs and columns.

Required tabs:

- `Source Mapping`
- `Fund Mapping`

Required Source Mapping columns:

| Column | Expected header |
|---:|---|
| A | Filter Code |
| B | Prior Source Code |
| C | Prior Source Name |
| K | SRC I |

Accepted Source Mapping aliases include:

- `Filter` for Filter Code.
- `Previous Source Code` for Prior Source Code.
- `Previous Source Name` for Prior Source Name.
- `Source I` for SRC I.

Required Fund Mapping columns:

| Column | Expected header |
|---:|---|
| A | Filter |
| B | PR Fund Code |
| C | Fund Split Percent |
| D | Rounding IND |
| E | Takeover Amt |
| F | Fund Amount |
| G | TR Ref No |
| Q | Fund Descriptor Code |
| T | Re-Registering (Yes/No) |

Accepted Fund Mapping aliases include:

- `Filter Code` for Filter.
- `Previous Fund Code` for PR Fund Code.
- `Split` or `Contribution Allocation Percent` for Fund Split Percent.
- `Rounded Indicator` for Rounding IND.
- `Takeover Amount` for Takeover Amt.
- `Total Amount` for Fund Amount.
- `TR Ref Number` or `Ref Number` for TR Ref No.
- `Registering Y/N` or `Re-Registering` for Re-Registering (Yes/No).

The app can also inspect Source I information embedded under Source Mapping. If Source I is missing, it may warn that source cross-check warnings will be skipped.

### Mapping Validation States

The mapping panel can show:

- Pending: the workbook is being read.
- Invalid: required tabs/headers/data checks failed.
- Valid: the workbook passed validation.
- Valid with warnings: export may be possible, but the warnings need operator review.

Common validation issues:

- Missing `Source Mapping` tab.
- Missing `Fund Mapping` tab.
- Header row not found in the first 20 rows.
- Required columns are missing or mislabeled.
- Duplicate prior source codes.
- Duplicate prior fund codes.
- Duplicate Source I values or translation codes.
- No CIT rows found in Source Mapping or Fund Mapping.
- CIT rows missing SRC I values.

Best simple rule: warnings are not always blockers, but they are never decoration. Read them before export.

### Mapping Comparison

After a parse and a valid mapping workbook, the app compares actual parsed codes to mapping workbook codes.

The rule is simple:

- Actual data code missing from the Mapping File: red flag. Fix or investigate before export.
- Mapping-only code with no activity in the actual data: allowed. Usually safe to ignore.

The cool part: this makes the mapping review much more operational. You do not have to manually eyeball every source/fund code first; the app points you at the mismatches that matter.

### Open in Window

The mapping validation and comparison panels can open larger review windows.

Use this when:

- The validation result is long.
- You want a wider workspace for comparing code lists.
- You are presenting the issue to someone else.

The popout windows are temporary browser windows. Closing or refreshing the main app ends that review session.

## Export Workbook

`Export Workbook` creates and downloads an `.xlsx` file.

The export filename pattern is:

`[Case Number] - [Plan Name] - Full Parse.xlsx`

If Plan Name is blank, the fallback text is `Plan Name`.

Export requires:

- A selected source.
- Parsed reports with at least one found report.
- A supported export source.
- A valid non-empty case number.

Export does not strictly require a mapping workbook for basic report tabs. However, mapping-driven sheets such as `CONV FILE` are only included when a valid mapping workbook and fund totals are available.

### Sheets the Export Can Include

The generated workbook can include:

- Title Page: source, input file/folder, mapping summary, record counts, and sheet links.
- Custom Balance: full-parse support sheet when balance summary data exists.
- CONV FILE: mapping-driven fund total output when mapping validation is valid.
- CIT Elections: source-specific election output when the source has an election rule.
- One tab per included parsed report code.

Be careful with export interpretation. The app creates the workbook structure, but it does not replace business review of totals, mapping issues, or conversion readiness.

## Save, Load, and Handoff Rules

### What Is Saved Automatically

The app saves the selected visual theme in browser local storage under `dataParser_theme`.

That is the only persistent browser-saved setting visible in the current file.

### What Is Not Saved Automatically

The app does not appear to save:

- Loaded input file content after refresh.
- Selected folder after refresh.
- Parsed results after refresh.
- Uploaded mapping workbook after refresh.
- Custom report additions after refresh.
- Export history.

If you refresh or close the browser tab, plan to reload the source file/folder and mapping workbook.

### Handoff Best Practice

For a clean handoff, keep these together:

- Original provider extract file or folder.
- Mapping workbook used for validation.
- Downloaded export workbook.
- Notes about warnings, discarded records, and any custom report codes added.
- Case number and plan name used during export.

Nice use: if you need repeatability, create a case folder with `input`, `mapping`, `output`, and `notes` subfolders. That makes later review much easier.

## Using It With Other Apps

### Excel

The main handoff artifact is an Excel workbook.

Use Excel to:

- Review the Title Page.
- Filter report tabs.
- Compare row counts.
- Review CONV FILE output.
- Review CIT Elections output.
- Send report-specific downloads to someone who does not need the full parse.

### Mapping Workbooks

The mapping workbook must be a real `.xlsx` file with the expected Source Mapping and Fund Mapping structure.

Be careful with workbook edits:

- Do not rename required tabs unless the app can still resolve them.
- Do not move required headers far below the top of the sheet.
- Do not change required column names without using an accepted alias.
- Watch duplicate source/fund codes.

### Browser

The browser is the runtime.

Practical implications:

- File access happens through browser file pickers.
- Folder access uses browser directory upload support.
- Downloads go to the browser's normal downloads location unless the browser asks where to save.
- Local storage keeps only the theme.

### OneDrive / SharePoint

The app can read files that are locally available through OneDrive or synced folders, as long as the browser file picker can access them.

Best simple rule: make sure cloud files are actually available locally before parsing. Placeholder-only files can behave like missing files.

## Recommended Daily Workflow

1. Create or open the case work folder.
2. Put the provider extract(s) in an `input` folder.
3. Put the mapping workbook in a `mapping` folder.
4. Open `Main File.html`.
5. Select the source.
6. Enter case number and plan name.
7. Load the file or folder.
8. Review discarded detail first.
9. Review grand total, participants, source totals, and fund totals.
10. Upload the mapping workbook.
11. Review validation errors and warnings.
12. Review actual-vs-mapping comparison.
13. Export the workbook.
14. Move the downloaded file into the case `output` folder.
15. Add a short note if there were warnings, ignored mapping-only codes, custom reports, or skipped files.

## Common Mistakes

### Choosing the Wrong Source

Symptom:

- Lots of discarded rows.
- No parsed reports.
- Totals are blank or obviously wrong.

Fix:

- Switch to the correct data source and reload the input.

### Loading a File When the Source Expects a Folder

Symptom:

- File picker is inactive or nothing useful happens.

Fix:

- Use Select Source Folder for folder-mode sources.

### Loading a Folder With Too Much Noise

Symptom:

- Many skipped files.
- Harder audit trail.

Fix:

- Use a clean extract folder with only relevant provider files when possible.

### Exporting Without a Valid Case Number

Symptom:

- Export does not run and the case number field shows an error.

Fix:

- Use one of the accepted prefixes and the correct number of digits.

### Treating Mapping-Only Codes as Errors

Symptom:

- Operator spends time chasing codes that exist only in the mapping workbook.

Fix:

- Treat actual-data-missing-from-mapping as the red flag. Mapping-only codes are allowed.

### Ignoring Discarded Records

Symptom:

- Export looks clean but important rows never made it into a report.

Fix:

- Review discarded detail before export. Add a custom report only when you intentionally need to surface unsupported lines.

### Assuming Voya Can Export

Symptom:

- Export remains unavailable for Voya.

Fix:

- Current file has Voya export and breakdown support disabled. Use it for parse/review only unless the app is later updated.

### Refreshing Before Saving the Output

Symptom:

- Parsed state disappears.

Fix:

- Download the workbook before refreshing or closing the page.

## Feature Cheat Sheet

| Feature | Use this when | Watch out for |
|---|---|---|
| Data Source card | Starting a parse or switching provider layouts | Wrong source means bad parse results. |
| Case Number | Preparing export | Required for export. Prefix and digit count must be valid. |
| Plan Name | Naming the export clearly | Optional, but blank exports use fallback text. |
| Select Text File | Loading Fidelity-style single file input | Only active for file-mode sources. |
| Select Source Folder | Loading provider folder extracts | Browser folder picker must see local files. |
| Parse Summary | Checking row acceptance and totals | Discards require review. |
| Source/Fund Totals | Reconciling conversion-level totals | Missing totals can block useful mapping comparison. |
| Discarded Detail | Investigating skipped rows | `Add Code` creates a fallback report, not a full layout. |
| Report List | Seeing supported codes by source | Custom reports can be cleared. |
| Parsed Reports | Inspecting parsed rows | Preview shows 20 rows until expanded. |
| Download Report | Exporting one report only | Requires valid case number. |
| Upload Mapping File | Validating Source/Fund Mapping workbook | Required tabs and columns must exist. |
| Mapping Comparison | Finding missing source/fund mappings | Mapping-only codes are allowed. |
| Export Workbook | Creating the full `.xlsx` output | Conv File needs valid mapping and fund totals. |
| Theme Settings | Changing visual theme | Theme is saved locally in the browser. |

## Core Competency Checklist

An operator is ready to use this tool when they can:

- Explain which source matches each provider extract.
- Know whether the source expects a file or folder.
- Enter a valid case number and understand why export requires it.
- Load a clean source file/folder.
- Read accepted/discarded counts.
- Investigate discarded line detail.
- Explain source totals and fund totals.
- Upload and validate a mapping workbook.
- Recognize mapping validation errors versus warnings.
- Explain why actual-data-missing-from-mapping is a red flag.
- Explain why mapping-only codes are allowed.
- Export the full workbook.
- Export a single report workbook.
- Preserve input, mapping, output, and notes together for handoff.

## Operator Notes

This tool is high leverage because it centralizes three jobs that are easy to do inconsistently by hand: parsing provider extracts, checking conversion totals, and validating mapping coverage.

The risk is that it can make a messy input look orderly. The interface can generate clean tables and workbooks, but clean formatting is not the same thing as a clean case. The operator still needs to inspect counts, totals, discarded records, mapping warnings, and any missing-code comparison before treating the output as ready.

Best simple rule: if the parse summary, mapping validation, and comparison panel all tell the same story, export is usually in a good place. If one of those disagrees, pause and resolve that mismatch before handoff.
