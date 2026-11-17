# Changelog

All notable changes to Workbook Studio (formerly Vendor Data Parser, Workbook Console, Data Parser Console and Data Parser App) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Versions below 1.0.0 are pre-release builds reconstructed from version control history. A plain-language version of this log is in `WHATS-NEW.md`.

## [Unreleased]

### Added
- Plan documents: `DCSUMMARY` ("DC Summary") output for the Plan Review Document (.docx). Parses provisions under Account/Plan Information, Eligibility, Service Crediting, Vesting, Compensation, Employee Contributions/Elective Deferrals and Loans into one row per provision, with ticked options (`w:checkBox` form fields and Wingdings `F0FE`/`F0FD`/`F078` symbols) and typed fill-ins as the answer.
- DC Summary carries highlighted questions and confirmations from the Requested Changes / Confirmed column.
- DC Summary reads vesting schedule tables and nested Word tables (`planDocsSplitTables`).
- `PLANFACTS` now includes Contribution Types and Account Information rows from the Plan Review Document.
- `Test Samples/Plan Review Documents/Practice PRD.docx`, a fictional Plan Review Document, and its generator `make-practice-prd.py`.
- `CHANGELOG.md` and `WHATS-NEW.md`, shown in the app under What's new.

### Documentation
- Walkthrough video re-cut to 5:09 with vendor additions, How it's read, export folder and separate-files options, and Merger compare. Phone encode at CRF 30.

## [1.0.0] - 2026-11-16

Workbook Studio becomes the single supported app. Commit `189a226`.

### Added
- Merger compare reader (reader v1): toolbar button and drop handler for merger compare PDFs. Text extracted client-side with pdf.js 3.11.174 (cdnjs, unpkg fallback); no upload. Tabs: Summary, Source mapping, All checked items, Check these, Check this file (diagnostic report with no plan data). Excel export with Plan Provisions, Source Mapping, All Checked Items and Check These sheets.
- Plan documents source (`PLAN DOCUMENTS`): reads the Onboarding Package (.xlsx), Plan Review Document (.docx), Submission Package and Merger Comparison PDF. Outputs `PLANFACTS`, `SRCMAP`, `PROVISIONS`, `MERGERCMP`, `CHECKLIST` and `SUBPACK`.
- OneAmerica `G#####.FINAL.xlsx` workbook support: Part Header, Contract Term, Loan Header and Loan Fund tabs. Warning when loan fund source balances do not sum to the Loan Header balance.
- Report layout view: How it's read / Show data toggle per report, listing start position, length and an example value for every field.
- `Workbook Studio - Demo.html`, built by `tools/build-demo.cjs` with the fictional Fidelity special rollover sample preloaded.
- `tests/`: Playwright vendor regression suite. Runs every fictional sample in `Test Samples/Vendor Files` through the app and diffs each exported sheet against `tests/expected`. `npm test` to run, `npm run test:update` to re-baseline.
- `.gitattributes` disables line-ending conversion so fixed-width samples stay byte-exact.

### Changed
- `Workbook Studio.html` at the project root is the only app. Changes are made there directly; `sync-from-app.cjs` is retired.

### Removed
- `Data Parser App.html` and the Workbook Studio build pieces (`Microsoft Concepts/`, Focus variants) moved to `Archive/`.

## [0.11.0] - 2026-11-16

Commits `4485c09`, `8a2e320`.

### Added
- Export option to save each app-built sheet (breakdown, Balance Export, CONV FILE, basis, elections, loan reports) as its own workbook alongside the full workbook. Default on.
- Export to a chosen folder via the File System Access API. The folder handle is remembered between sessions; falls back to Downloads.
- Alerus Loan Header and Loan Source reports.
- Ameritas Loan Header and Loan Source reports; Ameritas allocation file parsing.
- Workbook Studio (Microsoft-style ribbon concept) with Demo and Focus variants, and `sync-from-app.cjs` to rebuild all four from `Data Parser App.html`.

## [0.10.0] - 2026-11-09

Commit `c6576f7`.

### Added
- Alerus service termination CSVs, including SERVTERM, LOAN and LOANPMT file names. Skips the title row, parses comma-grouped amounts as numbers, restores leading zeros on SSN and ZIP, blanks `00/00/00` dates, adds code descriptions from the vendor legend, and drops the SSN 1 placeholder account.

### Fixed
- Alight individual per-record files.
- Roth basis for vendors that supply their own basis figures.

## [0.9.0] - 2026-11-06

Commit `1c0660c`.

### Added
- Vendor-neutral `957 PRIOR YEAR` source: reads the RPT-957 Participant Valuation Summary PDF, one row per participant with year totals, auto-detected from the PDF, with a plan-total tie-out check.
- 957 parser captures NET ROTH.
- Roth rollover split in Roth Basis.
- Per-source opt-out of auto-added summary tabs.

### Changed
- Roth Basis part 1 and Fund and Source Breakdown layout.

## [0.8.0] - 2026-11-02

Commits `93694e4`, `2c08019`, `2adbdd9` (2026-11-03).

### Added
- Empower Roth Basis output.
- Multi-file vendors keep earlier files when more are added; the file card accepts dropped files.
- Preview includes export-only sheets (breakdown, Balance Export, CONV FILE, basis, elections) and refreshes after a mapping upload.

### Changed
- Empower BALANC and ALLOC fund codes drop the appended qual digit (`IA55R61` to `IA55R6`). The summary code cleaner strips only a space-separated qual, so the s- file, Balance Export, CONV and breakdown share codes.
- Fund and Source Breakdown shows source and fund side by side; transfer-in-kind funds get their own table.
- Paychex loan report deduplicated per participant and loan number. Loan Source dollars come from the loan report, split by LOAN-line proportions. LOAN excluded from the wire total.
- Report tabs restored and wrap; breakdown section open by default; taller fund list in the CONV dialog.

### Removed
- Retired Console app and per-vendor parser files.

## [0.7.0] - 2026-10-29

Commits `a9584a4` (2026-10-28), `9cb13e1`, `b1b973e`, `24a9eef`, `fa82028`.

### Added
- Conversion type prompt on export: Cash, Mapping, Transfer in kind, or mixed. Mixed adds per-type Balance Export and CONV FILE tabs; TIK sets Re-Reg to Y.
- Split funds: one CONV row per Fund Mapping row. Amount is fund total times split percent, with rounding remainder on the last row. TA code and Re Reg taken per row.
- `.xls` mapping workbooks, including the Accounting-format check.
- TR Ref No (Fund Mapping column G) validated as `YYYYMMDD` plus 6 alphanumerics and copied into the CONV Ref Number column.
- Source I read from the Rollover row of the optional `SOURCE_I` table on the source mapping tab, with warnings when missing, ambiguous or non-numeric.
- Principal NQ outputs and tab-name detection; John Hancock CIT Elections tabs kept.

### Changed
- Mapping tabs matched case- and spacing-insensitively (Source Map/Mapping, Fund Map/Mapping).
- Mapping validation checks data, not headers. Header mismatches are warnings. Only uppercase `CIT` rows count; dashes are blanks.
- Source rules: K numeric only, M 1 to 8. Fund rules: C splits sum to 1 per fund, D Y/N follows C, E sums to F, G flagged in Accounting format, T is Y/N/Yes/No.
- Fund Mapping tab selection prefers the plain tab (or main/original/full/master/all) over variants such as "Fund Mapping TIK"; ties go to the tab with the most rows; the chosen tab is reported.
- Fund Mapping rows count whenever a prior fund code is present. A dash prior fund code marks a new fund and is skipped.
- A fund missing from Fund Mapping fails reconciliation instead of defaulting to cash.
- Select funds lists TIK funds first, flags unmapped funds, and disables Continue until every fund is picked.
- Split funds no longer reported as duplicates or ambiguous.

### Fixed
- Paychex 957 detail labels: first two characters Fund ID, last character Source ID.
- Voya, Ameritas, Alight and Paychex parsing fixes.

## [0.6.0] - 2026-10-23

Commit `94e72ab`.

### Added
- Alight deconversion text files (per record type or a combined `Records.txt`) with the Data Dictionary workbook. Lines sorted by embedded record tag; codes named from the dictionary; signed amounts and implied decimals decoded; filler dates blank; repeating slots expanded to rows; Dictionary Check tab compares expected counts.

## [0.5.1] - 2026-10-19

Commits `3c5daa6`, `df69819`.

### Changed
- Fidelity lists unknown record codes with file and line numbers. Paychex and OneAmerica name skipped files and describe the non-data lines.

### Fixed
- Title Page blank cells were written as empty strings, which blocked headings from overflowing into the next column in Excel.

## [0.5.0] - 2026-10-17

Commits `a231778`, `4bfa5af`, `0a1adcb`.

### Added
- Data Parser App with a Title Page contents tab and formatted reports.
- Fidelity PS86 summary by source beside the totals.

### Changed
- Case number and plan name required to export.
- Case number format: T plans 6 digits + 2 spaces, others 5 digits + 3 spaces; case numbers starting with 67 accepted (6 digits, 4 spaces, 5 digits).
- Export file name keeps case spacing and drops the "- RAW" tag; export preview shows the file name once.

## [0.4.0] - 2026-10-16

Commits `3959bf8` (2026-10-15), `006a9b2`, `fde41bd`.

### Added
- Data Parser Console app files.
- Ascensus derived ROTH report and Roth Basis export sheet: SSN, Roth Tax-Free Contribution Basis and Roth Hardship Basis (ROTH Ctbns less Withdrawals), Pre-Tax Hardship Available Amount, first Roth contribution year. Plug SSNs and all-zero participants skipped.
- Fidelity Special Rollover Breakout tab (SSN, Non-Roth, Roth, First Roth Year, Basis) when the balance file holds PS86; the source holding PS86 is treated as Roth.
- Mock Fidelity file covering the rollover cases.

### Changed
- Fidelity fund PS86 excluded from balance totals, Fund and Source Breakdown, CONV FILE and Balance Export.
- Roth Basis shows only the first Roth contribution year.
- Special Rollover Breakout basis column uses Roth Gross.
- Auto Deferrals sheet ignores "Hardship Available" columns.

## [0.3.1] - 2026-08-16

Commit `c66ce9d`.

### Changed
- v2/v3 UI polish passes (steel theme cleanup); vendor layout screenshots and standalone mocks added as references.

## [0.3.0] - 2026-08-14

Commits `38da0da`, `b0464ee`, `6204eea`, `3f1230b`.

### Added
- American Funds on the shared ZTR051 transmission spec: all nine 750-byte records, implied 2-decimal numerics with overpunch signs, `YYYYMMDD` dates, derived Calculated Hardship Basis column. Plan Service Termination summary PDF via the participant summary parser with a money-type label map.
- T985 report; Voya/OMNI package with cross-drop file accumulation; TIAA's seven DCNV CSVs; John Hancock discontinuance workbook and its ten per-report CSV delivery.
- Principal dual-flavor workbook parser: RIS Contract Terms ePackage (15 participant tabs) and nonqualified De-conversion file (5 core tabs), flavor detected from tab names.
- Field guide page.

### Changed
- Main file renamed to `Vendor Data Parser.html`.
- Empower loan record key renamed `LOANS` to `LOAN`.

### Fixed
- Fixed-width layouts rebuilt from vendor spec sheets so every vendor covers its full record width.
  - Empower: 18 reports / 433 fields, LONBAL and VEST added, PARTS 9 to 47 fields, four lengths corrected.
  - ADP: PH 24 to 90 fields, PF 10 to 14, IN 13 to 28, LH 15 to 24, LF 8 to 11. Sign columns kept, so negative balances no longer read as positive.
  - Nationwide: 18 fields added to PT, 3 loan flags to LN, 1 field to PR, one MT length corrected. Newport verified unchanged.
- Ascensus header aliases so "Social Security Number" anchors tabs.
- Ascensus filename rule tightened so "Deconversion File" no longer matches Principal.

## [0.2.0] - 2026-07-07

Commits `3a34c42`, `1586478`.

### Added
- Workbook Console workspace under version control.

### Removed
- Manual app-version snapshots (preserved in the initial commit).

## [0.1.0] - 2026-06

Reconstructed from the `archive/app-versions` snapshots in the initial commit. Each entry is the change a "before-..." snapshot was taken for. Dates are approximate.

### Added
- Export template shape and XML workbook format (2026-06-10).
- Mapping template validator, source mapping surface validation, and `.xlsm` mapping files (2026-06-10).
- Fidelity summary tabs, one row per SSN (2026-06-18).
- Loan source record lines and loan source SSN (2026-06-18).
- Newport, Empower and ADP summary additions; vendor summary tabs (2026-06-19).
- Vendor file picker mode (2026-06-19).

### Changed
- Report row layout and report width autofit (2026-06-10).
- Export uses the current plan name; mapping upload made optional in the UI (2026-06-10).

### Fixed
- Fidelity record resolver regression (2026-06-10).
