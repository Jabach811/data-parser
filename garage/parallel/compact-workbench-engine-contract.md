# Compact Workbench Engine Preservation Contract

## Purpose

`Workbook Console - Compact Workbench.html` is a presentation-only sibling of
`Workbook Console - Source refresh.html`. The parser, mapping, and export
engines remain in the sibling; the compact layout may move their elements but
must not rename or clone the IDs below.

Run the automated check from `Data Parser`:

```powershell
node garage/scripts/test-compact-workbench-contract.mjs
node garage/scripts/test-compact-workbench-contract.mjs "Workbook Console - Source refresh.html"
```

The first command targets the compact sibling by default. The second command
is the current baseline check.

## Source registrations

The source registry must retain exactly these ten keys. The test reports how
many are present and fails unless all ten registrations remain discoverable.

1. `NEWPORT`
2. `FIDELITY`
3. `VOYA`
4. `PAYCHEX`
5. `ONEAMERICA`
6. `VANGUARD`
7. `EMPOWER`
8. `ADP`
9. `NATIONWIDE`
10. `PRINCIPAL`

Source configuration invariants:

- `CONFIG`, `SOURCE_RUNTIME_CONFIG`, and `applySourceRuntimeConfig` continue
  to supply source metadata, accepted files, picker help text, and normalizers.
- `getSelectedSource`, `getFileAcceptForSource`,
  `getSourceFilePickerHelpText`, `usesSelectedFileSet`, and
  `resolveRecordForSource` remain the shared dispatch layer.
- `parsePayload` is the fixed-width/text route and `parseSelectedFilesPayload`
  is the multi-file/custom-parser route.
- Custom parser routes remain available for Paychex, OneAmerica, Vanguard,
  Empower, ADP, Nationwide, Newport, and Principal. Voya and Fidelity retain
  their configured generic text parsing path.

## Engine entry points

### Parse and rendering

- `parsePayload`
- `parseSelectedFilesPayload`
- `renderParse`
- `resolveRecordForSource`
- `parsePaychexFolderSource`
- `parseOneAmericaFolderSource`
- `parseVanguardFolderSource`
- `parseEmpowerFolderSource`
- `parseAdpFolderSource`
- `parseNationwideFolderSource`
- `parseNewportFolderSource`
- `parsePrincipalWorkbookFolder`

### Mapping validation

- `handleMappingFileChange`
- `validateMappingWorkbook`
- `validateMappingSheet`
- `validateSourceMappingRows`
- `validateFundMappingRows`
- `renderComparisonPanel`
- `readZipEntries`
- `parseWorkbookSheets`
- `parseWorksheetRows`

### Workbook and report export

- `downloadWorkbookForReports`
- `downloadWorkbook`
- `downloadSingleReport`
- `buildWorkbookFiles`
- `createZip`
- `triggerWorkbookDownload`
- `exportWorkbookBtn` remains the full-workbook export control; report cards
  retain their `data-download-report` event contract.

## Required DOM IDs

These IDs are directly resolved by the current application scripts. Presentation
wrappers are allowed, but each ID must remain a single element in the document.

```text
acceptedLinesText          caseNumberInput           caseNumberMessage
clearCustomReportsBtn      comparisonResults         comparisonStatus
comparisonSummary          dataSourceCardBadge       dataSourceCardChips
dataSourceCardIcon         dataSourceCardMeta        dataSourceCardOptions
dataSourceCardSelect       dataSourceCardStatus      dataSourceCardTitle
dataSourceCardTrigger      dataSourceSelect          discardedLinesText
discardFlipClip            discardFlipWrap           discardText
errorText                  exportWorkbookBtn         fileInput
fileInputBlock             filePickerButtonText      filePickerText
fundBreakdownClip          fundBreakdownText         fundCountText
fundFlipWrap               grandTotalText            inputModeNote
loadingBox                 loadingFill               loadingNote
loadingPercent             loadingTitle              mappingFileInput
mappingImportBtn           mappingValidationPanel    navStatus
participantCountText       payloadInput              planNameInput
reportOutputs              sourceBreakdownClip       sourceBreakdownText
sourceCountText            sourceDetails             sourceFlipWrap
summaryValidationPanel     totalLinesText
```

## Offline runtime markers and behavior invariants

- Embedded Inter font data remains present as `data:font/woff2;base64`.
- The in-page XLSX reader/writer remains present: `readZipEntries`,
  `parseWorkbookSheets`, `parseWorksheetRows`, and `createZip`.
- The local PDF fallback remains present as `extractPdfTextLegacy`; its
  `loadPdfJsLibrary` helper may still try the baseline's two legacy CDN URLs
  first, but parsing falls back locally if unavailable. Do not add new remote
  script, stylesheet, module, or `@import` runtime dependencies.
- Mapping validation, case-number checks, clear/reset, loading state, parser
  progress, report export, and workbook export keep their existing handlers.
- The compact skin may append styles/scripts and rearrange existing nodes, but
  it must not replace parser, mapping, ZIP/XML, or export function bodies.

## Known limitation to resolve separately

The refresh baseline is not fully network-independent for PDF enhancement:
`loadPdfJsLibrary` tries CDN-hosted pdf.js before the local legacy fallback.
The preservation test permits only those two known baseline fallback strings so
the baseline itself can be used as a passing reference. Any new external runtime
reference fails the test; removing or embedding pdf.js is a separate behavior
change and is outside this compact-layout task.
