# Compact Workbench Test Report

## Status at tester-lane handoff

`Workbook Console - Compact Workbench.html` does not exist at this checkpoint. All checks that require that deliverable are **NOT RUN**; no pass result is inferred from the preserved baseline.

## Preserved-file baseline

Captured with `Get-FileHash -Algorithm SHA256` before integration.

| File | SHA-256 |
| --- | --- |
| `Workbook Console - Source refresh.html` | `ABF5BA39D1A89215136A2838487F83A036777D0F67F111311F285579EC2F5A46` |
| `Workbook Console - Source.html` | `BB2F3F4939DF5C31899008D838F049919B6AFB64956B70FCEE6BB569321230CA` |
| `Workbook Console.html` | `EB899985CEA5D85C2E5BF946958D84AD1B5EE7813F5046B4E3A1A22B810A3882` |

Re-run after integration and compare each value exactly:

```powershell
Get-FileHash -Algorithm SHA256 `
  'Workbook Console - Source refresh.html', `
  'Workbook Console - Source.html', `
  'Workbook Console.html'
```

## Static UI contract

`garage/scripts/test-compact-workbench-ui.mjs` defaults to `Workbook Console - Compact Workbench.html` and also accepts that target as its first argument. It checks for the scoped skin and adapter IDs, the `compact-workbench` body-class adapter, Configure/Review/Export/Reports labels, at least three button detail controls with `aria-expanded` plus linked `aria-controls` regions, a reduced-motion override, the 1023px and sub-760px breakpoints, and no page-root rule that enables horizontal scrolling.

```powershell
node garage/scripts/test-compact-workbench-ui.mjs
node garage/scripts/test-compact-workbench-ui.mjs 'Workbook Console - Compact Workbench.html'
```

Current final-deliverable status: **NOT RUN** — target file is absent.

### Harness verification at this checkpoint

- `node --check garage/scripts/test-compact-workbench-ui.mjs` exited `0`.
- `node garage/scripts/test-compact-workbench-ui.mjs` exited `1` with `target HTML does not exist: ...Workbook Console - Compact Workbench.html`, confirming the required clean missing-target failure path.
- Against `Workbook Console - Source refresh.html`, the UI contract exited `1` for the absent Compact Workbench skin/adapter/detail-control/1023px markers. This is expected and is not a final-deliverable result.

## Intended static-suite commands

Run from `Data Parser` after the sibling exists. The existing dark, refresh, and vendor scripts use environment variables rather than positional target arguments.

```powershell
node garage/scripts/test-compact-workbench-ui.mjs 'Workbook Console - Compact Workbench.html'
node garage/scripts/test-compact-workbench-contract.mjs 'Workbook Console - Compact Workbench.html'
$env:MAPPING_CONTRACT_HTML = 'Workbook Console - Compact Workbench.html'; node garage/scripts/test-dark-ui-mapping-contracts.mjs; Remove-Item Env:MAPPING_CONTRACT_HTML
$env:REFRESH_CONSOLE_HTML = 'Workbook Console - Compact Workbench.html'; node garage/scripts/test-refresh-refactor-contracts.mjs; Remove-Item Env:REFRESH_CONSOLE_HTML
$env:PICKER_CONTRACT_HTML = 'Workbook Console - Compact Workbench.html'; node garage/scripts/test-vendor-file-picker-contract.mjs; Remove-Item Env:PICKER_CONTRACT_HTML
```

| Suite | Current status | Reason |
| --- | --- | --- |
| Compact Workbench UI contract | **NOT RUN** | Final sibling absent. |
| Compact Workbench engine/DOM contract | **NOT RUN** | Script and final sibling not available to this tester lane at checkpoint. |
| Refresh refactor contract | **NOT RUN** | Final sibling absent. |
| Vendor file picker contract | **NOT RUN** | Final sibling absent. |
| Dark UI/mapping contract | **NOT RUN** | Final sibling absent. It accepts `MAPPING_CONTRACT_HTML`, but its dark-theme assertions may not be valid for this light Compact Workbench direction; record the actual result rather than treating it as an automatic regression pass. |

## Fixture and browser-smoke plan

Available local fixtures include vendor sample uploads under `garage/test-upload-files/vendor-file-picker`, the Principal import workbook, and valid/invalid mapping workbooks under `garage/test-fixtures`.

After integration, open the local sibling and run the following manual checks at 1440, 1024, 768, and 390 CSS pixels:

1. Confirm Configure, Review, Export, and Reports remain reachable; at 768 the rail retains accessible labels, and at 390 the compact step bar is reachable.
2. Confirm the primary action is visible and discarded/source/fund details open from keyboard-operable controls.
3. Use a text-vendor upload, `garage/test-fixtures/1-12345 Mapping Validation Import Fixture.xlsx`, `Mapping Validation - Valid Messy Fixture.xlsx`, and `Mapping Validation - Invalid Row Errors Fixture.xlsx`; record parser completion, visible metrics, mapping state, and export-button enablement.
4. Record page errors, console errors, and `document.documentElement.scrollWidth <= window.innerWidth` at each viewport.

Current browser/fixture status: **NOT RUN** — final sibling absent. Browser automation is also unavailable in this environment: Chrome and Edge were not found on `PATH` or in their standard program-file locations.

## Local tool availability

| Tool | Availability |
| --- | --- |
| Node.js | Available — `v24.14.0` |
| npm | Available — `11.9.0` |
| Python | Available — `3.11.2` |
| Chrome / Edge executable | Not found during this checkpoint |

## Risks to carry into integration

- The static UI test intentionally requires three explicit linked detail buttons; the adapter must add buttons with both `aria-expanded` and `aria-controls`, and each referenced region must have an ID.
- The 1023px and sub-760px breakpoints must appear in the injected CSS. Horizontal scrolling may be enabled on local table wrappers, but not on `html` or `body`.
- The dark UI/mapping contract is target-configurable through `MAPPING_CONTRACT_HTML`, but several assertions are specifically dark-theme presentation expectations. A failure against the light Compact Workbench needs review; do not mask it or call it an engine regression automatically.

## Final integration run

The sibling was created at `Workbook Console - Compact Workbench.html` and tested on 2026-07-19.

| Check | Result | Evidence |
| --- | --- | --- |
| Compact Workbench engine/DOM contract | **PASS** | `node garage/scripts/test-compact-workbench-contract.mjs` reported `passed: true`, `sourceCount: 10`, no missing IDs, and no new external runtime references. |
| Compact Workbench UI contract | **PASS** | `node garage/scripts/test-compact-workbench-ui.mjs` passed 13 checks, including regression coverage for legacy stacked headers and dark metric-pill leakage. |
| Vendor file-picker contract | **PASS** | Targeted run passed all 4 checks and parsed every inline script block successfully. |
| Export workbook XML contract | **PASS** | Targeted run reported `Export workbook XML checks passed`. |
| Preserved source hashes | **PASS** | All three SHA-256 values still match the baseline table above exactly. |
| Refresh refactor contract | **BASELINE-LIMITED** | The target and preserved refresh baseline both fail the stale `inputMode` assertion; the current source intentionally no longer declares that property. |
| Dark UI/mapping contract | **BASELINE-LIMITED** | The target and preserved refresh baseline both fail the same three old presentation assertions for the kinetic loading style and report-row layout. Engine-focused mapping coverage is supplied by the new preservation contract. |
| Browser/viewport smoke | **PASS** | Browser screenshots and computed-style checks passed at 1440, 1024, and 768. A DevTools device-metrics run also passed at a true 390x844 CSS viewport: `innerWidth`, `clientWidth`, and root/body `scrollWidth` were all 390; the four-column top step bar was fully visible; and zero overflowing elements were detected. |
| Interactive fixture parsing | **PARTIAL PASS** | PAYCHEX parsed both supplied fixtures to 100% with Total 18, Accepted 4, Discarded 14, Review navigation reachable, and zero console/page errors. Root `mapping.xlsx` validated in about 112 ms (`is-valid`, 1 source row, 1 fund row); reconciliation then correctly reported two input-code mismatches and left export enabled. The garage “Valid Messy Fixture” reported `Missing Source Mapping tab` in both the sibling and preserved refresh baseline, so that result is a fixture-shape/baseline issue rather than a reskin regression. Two Principal fixtures reached a clean 100% terminal state but were rejected for missing/detecting the expected `Account Value Data` structure. The invalid-row mapping fixture was rejected before row validation because its `Source Mapping` sheet was not recognized. All rejection paths remained responsive with zero console/page errors. |

The final sibling SHA-256 is `77B770AF1B22819ED3D938BA18BFA9DC343D6960988B1D3F4795FA594B7BA5CB`.
