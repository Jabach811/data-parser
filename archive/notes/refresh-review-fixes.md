# Review fixes for "Workbook Console - Source refresh.html"

Review of the refactor vs. "Workbook Console - Source.html". The config-driven source setup (`SOURCE_RUNTIME_CONFIG`), the shared `createTextParsingToolkit`, and the per-source normalizers are all correct — leave them alone. Three issues to fix:

## 1. Dead code left inside both pop-out functions (must fix)

The new `return buildPopoutDocumentHtml({...})` was inserted at the top of each function, but the entire old implementation was left below it, unreachable:

- `getMappingPopoutDocumentHtml` — old code starts around line 14384 (right after the new `return`) and runs to the end of the function, including a duplicate `var panel` declaration and the full old CSS string.
- `getComparisonPopoutDocumentHtml` — old code starts around line 17164, same pattern, including duplicate `var statusHtml/summaryHtml/resultsHtml` declarations.

Delete everything between the new `return buildPopoutDocumentHtml({...});` and the closing `}` of each function. This dead code is why the refreshed file is ~9.5KB larger than the original despite being a dedup refactor.

## 2. Pop-out CSS lost most of its styling rules (must fix)

The new shared constants `MAPPING_POP_OUT_CSS` and `COMPARISON_POP_OUT_CSS` (defined near line 17128) kept only the body/shell/layout rules and dropped roughly 25 rules each that the old inline versions had — the pop-out-specific typography and sizing overrides:

- `.mp-header`, `.mp-header-label`, `.mp-header-status` (27px), `.mp-toggle`, `.mp-body`, `.mp-section`, `.mp-section-title`, `.mp-note`, `.mp-list`, `.mp-stat`, `.mp-chip`, `.mp-sheet-*`, `.mp-error-*`, `.mp-success`
- `.comparison-status`, `.comparison-metric` + `strong` + `-value` (32px) + `-note`, `.comparison-section` + `-head` + `-summary` + `-value` (28px) + `-note`, `.comparison-badge`, `.comparison-toggle`, `.comparison-note`, `.comparison-empty`, `.comparison-list`, `.comparison-item`, `.comparison-code`, `.comparison-meta`, `.comparison-amount`, plus extra media-query rules

The complete original rule sets are still present in the dead code from issue 1 (the old string literals at ~14399 and ~17177). Copy the full rule lists from there into the shared constants BEFORE deleting the dead code. The pop-outs must render identically to the original file.

## 3. `inputMode` is config that nothing reads (minor)

Every entry in `SOURCE_RUNTIME_CONFIG` sets `inputMode` ("text" or "workbook"), `applySourceRuntimeConfig` copies it onto `CONFIG`, and the custom-source builder defaults it — but no code ever reads `source.inputMode`. Either wire it up to whatever was intended (Principal's workbook handling still works some other way) or remove the property everywhere.

## Verify after fixing

- Re-diff against "Workbook Console - Source.html": the pop-out CSS rules in the new constants should match the old inline strings rule-for-rule.
- Open the file, run a comparison, and pop out both the mapping validation and comparison windows — they should look identical to the original file's pop-outs.
- The refreshed file should now be smaller than the original, not larger.
