# Compact Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a non-destructive Compact Workbench sibling of the Data Parser with a balanced modern desktop layout and unchanged parsing/export behavior.

**Architecture:** Clone the verified refresh artifact once, preserve its embedded engines and DOM contracts, then replace the presentation layer through a final scoped skin and layout adapter. Independent lanes produce the UI contract, engine-preservation checks, and test harness; the integration lane alone assembles the deliverable.

**Tech Stack:** Single-file HTML, CSS, vanilla JavaScript, embedded SheetJS/PDF runtime, Node.js contract tests, local Chrome smoke testing where available.

## Global Constraints

- Preserve `Workbook Console - Source refresh.html`, `Workbook Console - Source.html`, and `Workbook Console.html` byte-for-byte.
- Create only `Workbook Console - Compact Workbench.html` as the production deliverable.
- Preserve the same ten source registrations, parser functions, mapping rules, workbook schemas, report behavior, and embedded offline runtimes.
- Add no network dependencies.
- Use the A2 Balanced Compact Workbench layout and the exact design tokens defined in `docs/superpowers/specs/2026-07-19-compact-workbench-design.md`.
- Remove operational dependence on hover and card-flip interactions.
- Support 1440, 1024, 768, and 390 CSS pixel widths without page-level horizontal overflow.
- This workspace has no Git repository; do not attempt commits.

---

### Task 1: Engine and DOM preservation contract

**Files:**
- Create: `garage/parallel/compact-workbench-engine-contract.md`
- Create: `garage/scripts/test-compact-workbench-contract.mjs`
- Read: `Workbook Console - Source refresh.html`

**Interfaces:**
- Consumes: current refresh HTML and the global constraints above.
- Produces: a Node test command that accepts an optional target path, plus a preservation report listing required IDs, source keys, embedded runtimes, and export entry points.

- [ ] **Step 1: Inventory engine-facing contracts**

Record the ten source keys, required DOM IDs referenced by `getElementById` or equivalent selectors, parser dispatch entry points, mapping validation entry points, and export button handlers in `garage/parallel/compact-workbench-engine-contract.md`.

- [ ] **Step 2: Write the contract test**

Create `garage/scripts/test-compact-workbench-contract.mjs` so the target defaults to `Workbook Console - Compact Workbench.html`, verifies the file exists, verifies each required source key and DOM ID, rejects `http://` and `https://` runtime dependencies, and prints a JSON summary with `passed`, `sourceCount`, `missingIds`, and `externalRuntimeReferences`.

- [ ] **Step 3: Verify the test fails before integration**

Run: `node garage/scripts/test-compact-workbench-contract.mjs`

Expected: non-zero exit because `Workbook Console - Compact Workbench.html` does not exist yet.

- [ ] **Step 4: Verify the same contract can inspect the baseline**

Run: `node garage/scripts/test-compact-workbench-contract.mjs "Workbook Console - Source refresh.html"`

Expected: exit zero with `"passed": true` and `"sourceCount": 10`.

### Task 2: Balanced Compact Workbench presentation layer

**Files:**
- Create: `design/mocks/compact-workbench-ui-layer.html`
- Read: `Workbook Console - Source refresh.html`
- Read: `docs/superpowers/specs/2026-07-19-compact-workbench-design.md`

**Interfaces:**
- Consumes: existing class names and required IDs from the refresh artifact.
- Produces: a self-contained `<style id="compact-workbench-skin">...</style>` and `<script id="compact-workbench-layout-adapter">...</script>` fragment ready to inject before `</body>`.

- [ ] **Step 1: Build the scoped token and reset layer**

Define the design spec colors as CSS custom properties on `body.compact-workbench`, reset old gradients/shadows/transforms, and add reduced-motion handling. Scope every rule under `.compact-workbench`.

- [ ] **Step 2: Build the desktop shell**

Use existing major panels to create a 44-pixel app bar, 176-pixel navigation rail, and flexible workspace. The adapter must add `compact-workbench` to `body`, create only presentation wrappers, and move existing nodes without cloning or renaming IDs.

- [ ] **Step 3: Build balanced Configure and Review layouts**

Place source, case, plan, files, and progress into compact groups. Convert the KPI region to a single metric strip and make discarded/source/fund detail reachable by explicit disclosure buttons.

- [ ] **Step 4: Build Export and Reports layouts**

Keep mapping validation and Export Workbook visually primary. Present report controls as dense rows with visible actions rather than decorative tiles.

- [ ] **Step 5: Add responsive behavior**

At 1023 pixels collapse the rail; below 760 pixels switch to a top step bar and stacked workspace. Add `overflow-x:auto` only to local tables, never the page root.

### Task 3: Integrate the sibling deliverable

**Files:**
- Create: `Workbook Console - Compact Workbench.html`
- Read: `Workbook Console - Source refresh.html`
- Read: `design/mocks/compact-workbench-ui-layer.html`

**Interfaces:**
- Consumes: exact baseline bytes plus the scoped UI fragment from Task 2.
- Produces: the final standalone sibling file with all original engines and embedded dependencies intact.

- [ ] **Step 1: Copy the baseline to the sibling path**

Use `Copy-Item -LiteralPath 'Workbook Console - Source refresh.html' -Destination 'Workbook Console - Compact Workbench.html'` exactly once after confirming the destination does not exist.

- [ ] **Step 2: Inject the presentation layer**

Insert the complete `compact-workbench-skin` and `compact-workbench-layout-adapter` fragment immediately before the final `</body>`. Do not alter parser or export function bodies.

- [ ] **Step 3: Add explicit detail controls**

The adapter must expose discarded lines, source totals, and fund totals through keyboard-operable buttons with `aria-expanded` and linked regions. Existing content IDs remain unchanged.

- [ ] **Step 4: Run the preservation contract**

Run: `node garage/scripts/test-compact-workbench-contract.mjs`

Expected: exit zero, `"passed": true`, `"sourceCount": 10`, no missing IDs, and no external runtime references.

### Task 4: Regression and visual verification

**Files:**
- Create: `garage/parallel/compact-workbench-test-report.md`
- Test: `garage/scripts/test-refresh-refactor-contracts.mjs`
- Test: `garage/scripts/test-vendor-file-picker-contract.mjs`
- Test: `garage/scripts/test-dark-ui-mapping-contracts.mjs`
- Test: `garage/scripts/test-compact-workbench-contract.mjs`

**Interfaces:**
- Consumes: final sibling from Task 3 and existing fixtures.
- Produces: a test report containing exact commands, pass/fail output, viewport checks, console/page errors, and any unresolved risks.

- [ ] **Step 1: Prove preserved files were not changed**

Record SHA-256 hashes for the three preserved files before and after integration and assert that each pair matches.

- [ ] **Step 2: Run static contract suites**

Run the four named Node test scripts against the new sibling where they accept a target argument. For fixed-path scripts, copy the script to a temporary test-only variant or document that limitation; do not rewrite preserved production files.

- [ ] **Step 3: Run representative fixture smoke tests**

Exercise at least one text vendor fixture, the Principal XLSX fixture, the valid mapping workbook, and one invalid mapping workbook. Confirm parser completion, visible metrics, mapping state, and export-button enablement.

- [ ] **Step 4: Run browser smoke at four widths**

At 1440, 1024, 768, and 390 CSS pixels, confirm no page-level horizontal overflow, reachable navigation, visible primary action, keyboard-operable detail controls, zero console errors, and zero page errors.

- [ ] **Step 5: Write the final report**

Write exact evidence and any limitations to `garage/parallel/compact-workbench-test-report.md`. A test not actually run must be labeled `NOT RUN`, never inferred as passing.
