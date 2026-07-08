# Mapping Validator UI Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Mapping Validation panel's HTML/CSS to the approved "Direction B" dark-purple dashboard language across pending / invalid / valid / valid-with-advisories states, without changing any validation logic.

**Architecture:** Single-file app (`Main File.html`). Replace the `.mp-*` CSS block with a new `.mvp-*` block, rewrite `buildMappingPanelHtml` to emit the new DOM, update two event-delegation selectors (`.mp-open-window`, `.mp-toggle`) and the popout window's scaling overrides. No new files, no new dependencies.

**Tech Stack:** Vanilla JS in a single HTML file. No test framework, no build step, no git repo — verification is visual, reloading the file in a browser.

**Reference spec:** `docs/superpowers/specs/2026-04-21-mapping-validator-polish-design.md`

---

## File Structure

All changes in `Main File.html`:

| Concern | Lines (approx.) | Task |
|---|---|---|
| Orphan `.mp-panel` declaration | 518–519 | Task 5 |
| Main `.mp-*` CSS block | 632–738 | Task 1 (add `.mvp-*` alongside) + Task 5 (remove `.mp-*`) |
| `buildMappingPanelHtml` | 11045–11240 | Task 2 |
| `getMappingPopoutDocumentHtml` inline CSS overrides | 11263 | Task 4 |
| `toggleMappingPanel` / `closeMappingPanel` | 11391–11407 | Task 3 |
| Click delegation for `.mp-open-window` + `.mp-toggle` | 15659, 15669 | Task 3 |

---

## Task 1: Add the new `.mvp-*` CSS block

**Files:**
- Modify: `Main File.html` — insert a new CSS block immediately after the existing `.mp-*` block (after line 738, before the next CSS section)

**Rationale:** Add the new styles alongside the old ones so the old panel keeps rendering until Task 2 switches the DOM over. Gives a clean rollback point.

- [ ] **Step 1.1: Locate the insertion point**

Open `Main File.html`. Find line 738 (the closing `}` of `.mp-success`). Confirm the next non-blank line begins a different CSS section (not another `.mp-*` rule). The orphan `.mp-panel` at line 518 is handled in Task 5 — leave it alone for now.

- [ ] **Step 1.2: Insert the new CSS block**

Insert the following verbatim right after the existing `.mp-success` rule (after line 738, before the next section):

```css
/* ========== MAPPING VALIDATION PANEL (mvp-panel — Direction B polish) ========== */
.mvp-panel{
  display:none;margin-top:10px;
  background:linear-gradient(180deg,#1f1839,#15102a);
  border:1px solid rgba(185,169,255,.18);
  border-radius:14px;overflow:hidden;
  color:#f0ebff;font-size:14px;line-height:1.5;
}
.mvp-panel.is-open{display:block}
.mvp-panel:empty{display:none}
.mvp-panel.is-collapsed .mvp-body,
.mvp-panel.is-collapsed .mvp-tiles{display:none}
.mvp-panel.is-collapsed .mvp-toggle svg{transform:rotate(180deg)}

.mvp-banner{
  display:flex;align-items:center;gap:12px;
  padding:14px 18px;
  transition:background 180ms ease;
}
.mvp-banner.is-pending{background:linear-gradient(90deg,#3a3168,#2a2350)}
.mvp-banner.is-invalid{background:linear-gradient(90deg,#b14d2c,#8a3a1f)}
.mvp-banner.is-valid,
.mvp-banner.is-valid-warn{background:linear-gradient(90deg,#3d8a4f,#2d6e3c)}

.mvp-banner-icon{
  width:34px;height:34px;flex:0 0 auto;
  border-radius:50%;
  background:rgba(255,255,255,.18);
  display:grid;place-items:center;
  color:#fff;font-weight:700;font-size:16px;
}
.mvp-banner-text{flex:1;min-width:0}
.mvp-banner-title{color:#fff;font-weight:700;font-size:15px;line-height:1.25}
.mvp-banner-sub{color:rgba(255,255,255,.78);font-size:12px;margin-top:2px}

.mvp-banner-actions{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto}
.mvp-open-window{
  background:rgba(255,255,255,.16);color:#fff;
  border:1px solid rgba(255,255,255,.22);
  border-radius:8px;padding:5px 10px;
  font:500 11px/1 var(--font-body,system-ui);cursor:pointer;
}
.mvp-open-window:hover{background:rgba(255,255,255,.24)}
.mvp-toggle{
  background:rgba(255,255,255,.16);color:#fff;
  border:1px solid rgba(255,255,255,.22);
  border-radius:8px;width:30px;height:28px;padding:0;
  display:grid;place-items:center;cursor:pointer;
}
.mvp-toggle:hover{background:rgba(255,255,255,.24)}
.mvp-toggle svg{width:12px;height:12px;transition:transform 180ms ease}

.mvp-shimmer{display:flex;gap:5px}
.mvp-shimmer span{
  width:6px;height:6px;border-radius:50%;
  background:rgba(255,255,255,.6);
  animation:mvp-pulse 1.2s infinite ease-in-out;
}
.mvp-shimmer span:nth-child(2){animation-delay:.15s}
.mvp-shimmer span:nth-child(3){animation-delay:.3s}
@keyframes mvp-pulse{
  0%,80%,100%{opacity:.25;transform:scale(.85)}
  40%{opacity:1;transform:scale(1.1)}
}

.mvp-tiles{
  display:grid;grid-template-columns:repeat(3,1fr);
  gap:1px;background:rgba(185,169,255,.12);
}
.mvp-tile{background:#1c1537;padding:14px 16px}
.mvp-tile-lbl{
  font-size:10px;letter-spacing:.12em;text-transform:uppercase;
  color:#a294d4;
}
.mvp-tile-val{
  font-size:30px;font-weight:800;color:#fff;line-height:1;margin-top:6px;
  font-feature-settings:"tnum";font-variant-numeric:tabular-nums;
}
.mvp-tile-val.is-err{color:#f7b46c}
.mvp-tile-val.is-skel{
  background:linear-gradient(90deg,#2a2350,#3a3168,#2a2350);
  background-size:200% 100%;height:30px;border-radius:6px;
  animation:mvp-skel 1.4s infinite linear;color:transparent;
}
@keyframes mvp-skel{
  0%{background-position:200% 0}
  100%{background-position:-200% 0}
}
.mvp-tile-sub{font-size:11px;color:#a294d4;margin-top:4px}

.mvp-body{display:block}
.mvp-section{
  padding:14px 18px;
  border-top:1px solid rgba(185,169,255,.12);
  animation:mvp-fade 180ms ease both;
}
@keyframes mvp-fade{
  from{opacity:0;transform:translateY(3px)}
  to{opacity:1;transform:translateY(0)}
}
.mvp-body > .mvp-section:nth-child(1){animation-delay:0ms}
.mvp-body > .mvp-section:nth-child(2){animation-delay:60ms}
.mvp-body > .mvp-section:nth-child(3){animation-delay:120ms}
.mvp-body > .mvp-section:nth-child(4){animation-delay:180ms}

.mvp-section-head{
  display:flex;align-items:center;gap:10px;
  font-size:11px;letter-spacing:.12em;text-transform:uppercase;
  color:#a294d4;margin-bottom:10px;
}
.mvp-section-title{flex:1}
.mvp-pill{
  font-size:11px;padding:2px 8px;border-radius:10px;font-weight:500;
}
.mvp-pill.is-err{background:rgba(239,123,80,.18);color:#f7926a}
.mvp-pill.is-warn{background:rgba(247,180,108,.18);color:#f7b46c}
.mvp-pill.is-ok{background:rgba(120,200,140,.18);color:#9ed4a8}

.mvp-chips{display:flex;flex-wrap:wrap;gap:5px}
.mvp-chip{
  font-size:11px;padding:3px 9px;border-radius:99px;
  background:rgba(185,169,255,.1);color:#d9cffd;
  border:1px solid rgba(185,169,255,.15);
}
.mvp-chip.is-miss{
  background:rgba(239,123,80,.12);color:#f7926a;
  border-color:rgba(239,123,80,.3);
}

.mvp-rows{display:grid;gap:4px}
.mvp-row{
  font-size:12px;color:#d9cffd;
  padding:8px 10px;border-radius:8px;
  display:grid;grid-template-columns:90px 1fr auto;gap:10px;
  align-items:center;
  background:rgba(185,169,255,.04);
}
.mvp-row.is-err{background:rgba(239,123,80,.08);border-left:2px solid #ef7b50}
.mvp-row.is-warn{background:rgba(247,180,108,.08);border-left:2px solid #f7b46c}
.mvp-row-label{
  color:#fff;font-weight:600;
  font-feature-settings:"tnum";font-variant-numeric:tabular-nums;
}
.mvp-row-msg{min-width:0;overflow-wrap:anywhere}
.mvp-row-tag{
  font-size:10px;padding:2px 6px;border-radius:6px;
  background:rgba(185,169,255,.12);color:#a294d4;
  text-transform:uppercase;letter-spacing:.08em;
  font-family:var(--font-mono,ui-monospace,monospace);
}
.mvp-more{font-size:11px;color:#a294d4;padding:6px 0 0;font-style:italic}
.mvp-empty{font-size:12px;color:#a294d4;font-style:italic}

@media (prefers-reduced-motion: reduce){
  .mvp-banner{transition:none}
  .mvp-shimmer span{animation:none;opacity:.6}
  .mvp-tile-val.is-skel{animation:none}
  .mvp-section{animation:none}
  .mvp-toggle svg{transition:none}
}
```

- [ ] **Step 1.3: Reload and verify the page still renders**

Open `Main File.html` in a browser (or reload if already open). Expected: the page loads with no visible change, no console errors. The new CSS is present but unused — the old panel keeps rendering normally.

Open devtools → Elements → search for `.mvp-panel` in the stylesheet. Expected: block is present.

---

## Task 2: Rewrite `buildMappingPanelHtml` to emit `.mvp-*` DOM

**Files:**
- Modify: `Main File.html` — replace the body of `buildMappingPanelHtml` (lines 11045–11240)

- [ ] **Step 2.1: Replace the function body**

Locate `function buildMappingPanelHtml(mappingState) {` (line 11045). Replace the function **and** the alias that follows it (`buildMappingTroubleshootHtml`, lines 11243–11245) with the code below. Keep everything outside this range untouched.

```js
  function buildMappingPanelHtml(mappingState) {
    var state = mappingState || {};
    var status = state.status || "invalid";
    var hasWarnings = !!(state.warnings && state.warnings.length);
    var diagnostics = state.diagnostics || {};
    var sourceDiag = diagnostics.source || {};
    var fundDiag = diagnostics.fund || {};
    var sourceInfoDiag = diagnostics.sourceInfo || {};
    var sourceDataDiag = diagnostics.sourceData || {};
    var fundDataDiag = diagnostics.fundData || {};
    var sourceInfoDataDiag = diagnostics.sourceInfoData || {};

    var srcErrRows = sourceDataDiag.errorRows || [];
    var fndErrRows = fundDataDiag.errorRows || [];
    var siErrRows = sourceInfoDataDiag.errorRows || [];
    var srcWarnRows = sourceDataDiag.warningRows || [];
    var fndWarnRows = fundDataDiag.warningRows || [];
    var siWarnRows = sourceInfoDataDiag.warningRows || [];

    var parts = [];
    var i;

    // ---------- Banner ----------
    var bannerCls, bannerTitle, bannerSub, bannerIcon;
    var showActions = true;
    var ariaBusy = false;

    if (status === "pending") {
      bannerCls = "is-pending";
      bannerTitle = "Validating workbook\u2026";
      bannerSub = "Reading sheets and checking layout";
      bannerIcon = "<div class=\"mvp-shimmer\"><span></span><span></span><span></span></div>";
      showActions = false;
      ariaBusy = true;
    } else if (status === "invalid") {
      bannerCls = "is-invalid";
      var totalErrors = (state.errors && state.errors.length) || 0;
      var sheetsHit = 0;
      if (srcErrRows.length) sheetsHit += 1;
      if (fndErrRows.length) sheetsHit += 1;
      if (siErrRows.length) sheetsHit += 1;
      bannerTitle = "Validation failed";
      bannerSub = String(totalErrors) + " issue" + (totalErrors === 1 ? "" : "s") +
        (sheetsHit ? " across " + String(sheetsHit) + " sheet" + (sheetsHit === 1 ? "" : "s") : "") +
        " \u00b7 fix and re-upload";
      bannerIcon = "!";
    } else {
      bannerCls = hasWarnings ? "is-valid-warn" : "is-valid";
      bannerTitle = "Workbook validated";
      if (hasWarnings) {
        var warnCount = state.warnings.length;
        bannerSub = String(warnCount) + " advisor" + (warnCount === 1 ? "y" : "ies") + " \u00b7 ready for export";
      } else {
        bannerSub = "Ready for export";
      }
      bannerIcon = "\u2713";
    }

    parts.push("<div class=\"mvp-banner " + bannerCls + "\" role=\"status\">");
    parts.push("<div class=\"mvp-banner-icon\" aria-hidden=\"true\">" + bannerIcon + "</div>");
    parts.push("<div class=\"mvp-banner-text\">");
    parts.push("<div class=\"mvp-banner-title\">" + escapeHtml(bannerTitle) + "</div>");
    parts.push("<div class=\"mvp-banner-sub\">" + escapeHtml(bannerSub) + "</div>");
    parts.push("</div>");
    if (showActions) {
      parts.push("<div class=\"mvp-banner-actions\">");
      parts.push("<button class=\"mvp-open-window\" type=\"button\" aria-label=\"Open validation details in a larger window\">Open in window</button>");
      parts.push("<button class=\"mvp-toggle\" type=\"button\" aria-label=\"Collapse panel\"><svg viewBox=\"0 0 12 8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M1 7L6 2l5 5\"/></svg></button>");
      parts.push("</div>");
    }
    parts.push("</div>");

    // ---------- Tiles ----------
    var srcCit = typeof sourceDataDiag.consideredCount === "number" ? sourceDataDiag.consideredCount : null;
    var fndCit = typeof fundDataDiag.consideredCount === "number" ? fundDataDiag.consideredCount : null;
    var siRows = typeof sourceInfoDataDiag.consideredCount === "number" ? sourceInfoDataDiag.consideredCount : null;

    function buildTile(label, value, sub, isErr, isSkel) {
      var cls = "mvp-tile-val" + (isErr ? " is-err" : "") + (isSkel ? " is-skel" : "");
      var inner = isSkel ? "" : escapeHtml(String(value));
      return "<div class=\"mvp-tile\">" +
        "<div class=\"mvp-tile-lbl\">" + escapeHtml(label) + "</div>" +
        "<div class=\"" + cls + "\">" + inner + "</div>" +
        "<div class=\"mvp-tile-sub\">" + escapeHtml(sub) + "</div>" +
        "</div>";
    }

    parts.push("<div class=\"mvp-tiles\"" + (ariaBusy ? " aria-busy=\"true\"" : "") + ">");
    if (status === "pending") {
      parts.push(buildTile("Source", "", "CIT rows", false, true));
      parts.push(buildTile("Fund", "", "CIT rows", false, true));
      parts.push(buildTile("Source I", "", "rows", false, true));
    } else {
      parts.push(buildTile("Source",
        srcCit == null ? "\u2014" : srcCit,
        srcErrRows.length ? (String(srcErrRows.length) + " error" + (srcErrRows.length === 1 ? "" : "s")) : "CIT rows",
        srcErrRows.length > 0, false));
      parts.push(buildTile("Fund",
        fndCit == null ? "\u2014" : fndCit,
        fndErrRows.length ? (String(fndErrRows.length) + " error" + (fndErrRows.length === 1 ? "" : "s")) : "CIT rows",
        fndErrRows.length > 0, false));
      parts.push(buildTile("Source I",
        siRows == null ? "\u2014" : siRows,
        siErrRows.length ? (String(siErrRows.length) + " error" + (siErrRows.length === 1 ? "" : "s")) : "rows",
        siErrRows.length > 0, false));
    }
    parts.push("</div>");

    // ---------- Body sections ----------
    if (status === "pending") {
      return parts.join("");
    }

    parts.push("<div class=\"mvp-body\">");

    if (status === "invalid") {
      var headerSpecs = [
        { label: "Source headers", diag: sourceDiag },
        { label: "Fund headers", diag: fundDiag },
        { label: "Source I headers", diag: sourceInfoDiag }
      ];
      for (i = 0; i < headerSpecs.length; i += 1) {
        var spec = headerSpecs[i];
        var d = spec.diag || {};
        var matched = d.matchedHeaders || [];
        var missing = d.missingHeaders || [];
        if (!matched.length && !missing.length) continue;
        parts.push("<div class=\"mvp-section\">");
        parts.push("<div class=\"mvp-section-head\"><span class=\"mvp-section-title\">" + escapeHtml(spec.label) + "</span>");
        if (missing.length) {
          parts.push("<span class=\"mvp-pill is-err\">" + String(missing.length) + " missing</span>");
        } else {
          parts.push("<span class=\"mvp-pill is-ok\">OK</span>");
        }
        parts.push("</div>");
        parts.push("<div class=\"mvp-chips\">");
        for (var mi = 0; mi < matched.length; mi += 1) {
          var mh = matched[mi];
          parts.push("<span class=\"mvp-chip\">" + escapeHtml(mh.letter + "\u2009\u00b7\u2009" + mh.name) + "</span>");
        }
        for (var xi = 0; xi < missing.length; xi += 1) {
          var xh = missing[xi];
          var xtxt = xh.letter + "\u2009\u00b7\u2009" + xh.name + (xh.actual ? " \u2192 found: " + xh.actual : " \u2014 not found");
          parts.push("<span class=\"mvp-chip is-miss\">" + escapeHtml(xtxt) + "</span>");
        }
        parts.push("</div>");
        parts.push("</div>");
      }

      var combinedErrors = [];
      for (i = 0; i < srcErrRows.length; i += 1) combinedErrors.push({ sheet: "Source", row: srcErrRows[i] });
      for (i = 0; i < fndErrRows.length; i += 1) combinedErrors.push({ sheet: "Fund", row: fndErrRows[i] });
      for (i = 0; i < siErrRows.length; i += 1) combinedErrors.push({ sheet: "Source I", row: siErrRows[i] });
      if (combinedErrors.length) {
        parts.push("<div class=\"mvp-section\">");
        parts.push("<div class=\"mvp-section-head\"><span class=\"mvp-section-title\">Row issues</span><span class=\"mvp-pill is-err\">" + String(combinedErrors.length) + "</span></div>");
        parts.push("<div class=\"mvp-rows\">");
        var maxErr = 8;
        for (i = 0; i < Math.min(combinedErrors.length, maxErr); i += 1) {
          var entry = combinedErrors[i];
          var er = entry.row;
          var tag = extractIssueColumnLetter(er.issues);
          parts.push("<div class=\"mvp-row is-err\">");
          parts.push("<div class=\"mvp-row-label\">" + escapeHtml(entry.sheet + " \u00b7 " + String(er.rowNumber)) + "</div>");
          parts.push("<div class=\"mvp-row-msg\">" + escapeHtml((er.issues || []).join(" \u00b7 ")) + "</div>");
          parts.push("<div class=\"mvp-row-tag\">" + escapeHtml(tag) + "</div>");
          parts.push("</div>");
        }
        parts.push("</div>");
        if (combinedErrors.length > maxErr) {
          parts.push("<div class=\"mvp-more\">+ " + String(combinedErrors.length - maxErr) + " more row(s) with issues</div>");
        }
        parts.push("</div>");
      }

      parts.push("<div class=\"mvp-section\">");
      parts.push("<div class=\"mvp-section-head\"><span class=\"mvp-section-title\">Common causes</span></div>");
      parts.push("<div class=\"mvp-empty\">Header rows below row 1 \u00b7 Legacy column labels \u00b7 Merged title rows \u00b7 File is not a standard .xlsx workbook</div>");
      parts.push("</div>");
    } else {
      var combinedAdv = [];
      for (i = 0; i < srcWarnRows.length; i += 1) combinedAdv.push({ sheet: "Source", row: srcWarnRows[i] });
      for (i = 0; i < fndWarnRows.length; i += 1) combinedAdv.push({ sheet: "Fund", row: fndWarnRows[i] });
      for (i = 0; i < siWarnRows.length; i += 1) combinedAdv.push({ sheet: "Source I", row: siWarnRows[i] });

      if (combinedAdv.length) {
        parts.push("<div class=\"mvp-section\">");
        parts.push("<div class=\"mvp-section-head\"><span class=\"mvp-section-title\">Advisories</span><span class=\"mvp-pill is-warn\">" + String(combinedAdv.length) + "</span></div>");
        parts.push("<div class=\"mvp-rows\">");
        var maxAdv = 8;
        for (i = 0; i < Math.min(combinedAdv.length, maxAdv); i += 1) {
          var aEntry = combinedAdv[i];
          var aw = aEntry.row;
          var aTag = extractIssueColumnLetter(aw.issues);
          parts.push("<div class=\"mvp-row is-warn\">");
          parts.push("<div class=\"mvp-row-label\">" + escapeHtml(aEntry.sheet + " \u00b7 " + String(aw.rowNumber)) + "</div>");
          parts.push("<div class=\"mvp-row-msg\">" + escapeHtml((aw.issues || []).join(" \u00b7 ")) + "</div>");
          parts.push("<div class=\"mvp-row-tag\">" + escapeHtml(aTag) + "</div>");
          parts.push("</div>");
        }
        parts.push("</div>");
        if (combinedAdv.length > maxAdv) {
          parts.push("<div class=\"mvp-more\">+ " + String(combinedAdv.length - maxAdv) + " more advisory row(s)</div>");
        }
        parts.push("</div>");
      }
    }

    parts.push("</div>");
    return parts.join("");
  }

  function extractIssueColumnLetter(issues) {
    if (!issues || !issues.length) return "";
    var m = /^([A-Z])\b/.exec(issues[0]);
    return m ? m[1] : "";
  }

  // Keep old name as alias so nothing else breaks
  function buildMappingTroubleshootHtml(mappingState) {
    return buildMappingPanelHtml(mappingState);
  }
```

- [ ] **Step 2.2: Reload the page with a validated mapping**

Open `Main File.html` in a browser. Select a data source and upload a known-good mapping workbook. Expected:
- Rail "Import" tile shows the pending loader, then flips to "Mapping File Validated"
- Below the rail, the new dark-purple `.mvp-panel` renders
- Green banner with "Workbook validated · Ready for export"
- Three dark tiles showing Source / Fund / Source I counts
- No console errors

- [ ] **Step 2.3: Verify the invalid state renders**

Upload a mapping workbook that is missing a header (e.g. rename column K in Source Mapping). Expected:
- Red banner with "Validation failed — N issues across M sheets · fix and re-upload"
- Tiles show counts with amber-colored values for sheets with errors
- Below the tiles: a "Source headers" section with a red-tinted chip showing the missing column
- A "Row issues" section (if CIT rows also failed rules)
- A "Common causes" one-liner at the bottom

- [ ] **Step 2.4: Verify the pending state renders**

Upload a large workbook (or slow the network tab to observe). Expected during the `await`:
- Purple banner with three pulsing dots in the icon
- Title "Validating workbook…"
- Three tiles with animated skeleton bars
- No body sections render until validation finishes

- [ ] **Step 2.5: Verify the valid-with-advisories state renders**

Upload a workbook that validates but contains at least one advisory-level issue (e.g. a CIT row with a blank K value in Source Mapping). Expected:
- Green banner, subtitle reads "N advisories · ready for export"
- Single "Advisories" section below the tiles, amber-stripe rows with "Sheet · row" labels

---

## Task 3: Update click delegation + toggle handlers

**Files:**
- Modify: `Main File.html` — click delegation at line 15659 and 15669
- Modify: `Main File.html` — `toggleMappingPanel` / `closeMappingPanel` at lines 11391–11407 (no code change needed, but verify they still target the panel correctly)

**Rationale:** The document-level click listener still looks for `.mp-open-window` and `.mp-toggle`. The new panel emits `.mvp-open-window` and `.mvp-toggle`. Update the selectors so the buttons work.

- [ ] **Step 3.1: Update the `Open in window` selector**

In `Main File.html`, find line 15659:

```js
    var mappingPopoutBtn = event.target && event.target.closest ? event.target.closest(".mp-open-window") : null;
```

Replace `.mp-open-window` with `.mvp-open-window, .mp-open-window` so the listener matches both during transition (Task 5 removes the old class entirely):

```js
    var mappingPopoutBtn = event.target && event.target.closest ? event.target.closest(".mvp-open-window, .mp-open-window") : null;
```

- [ ] **Step 3.2: Update the toggle selector**

In `Main File.html`, find line 15669:

```js
    var mpToggleBtn = event.target && event.target.closest ? event.target.closest(".mp-toggle") : null;
```

Replace with:

```js
    var mpToggleBtn = event.target && event.target.closest ? event.target.closest(".mvp-toggle, .mp-toggle") : null;
```

- [ ] **Step 3.3: Verify `toggleMappingPanel` still works**

Read the function at lines 11391–11396. Confirm it operates on `document.getElementById("mappingValidationPanel")` — that element ID is set elsewhere and is unchanged by this plan, so the function needs no edits. The class toggling (`is-open`, `is-collapsed`) uses names the new CSS also honors (see Task 1).

- [ ] **Step 3.4: Reload and verify the buttons**

Reload `Main File.html`, validate a mapping workbook. Click the chevron → panel body collapses (tiles and sections hide, banner stays). Click again → expands. Click "Open in window" → popout window opens (it will look stale/broken — that's fixed in Task 4).

---

## Task 4: Update the popout window CSS overrides

**Files:**
- Modify: `Main File.html` — inline CSS in `getMappingPopoutDocumentHtml` at line 11263

**Rationale:** The popout window serializes the panel's `outerHTML` and inlines a CSS override block. Every override currently targets `.mp-*` selectors — they need to target `.mvp-*` instead, with the recalibrated sizes from the spec.

- [ ] **Step 4.1: Locate the popout CSS string**

Open `Main File.html`. Find `function getMappingPopoutDocumentHtml()` at line 11247. The `return "<!DOCTYPE html>…` string at line 11263 contains a large inline CSS block starting with `html,body{min-height:100%;}body.mapping-popout-mode{…}`.

Inside that CSS string, all rules that begin with `body.mapping-popout-mode .mp-` must be replaced. The rules for `body.mapping-popout-mode .comparison-*` stay as-is.

- [ ] **Step 4.2: Replace the `.mp-*` override rules**

In the CSS string, find and replace this run of rules (they appear contiguously before the `.comparison-status` rules):

**Old (delete these):**

```text
body.mapping-popout-mode .mp-panel{display:block !important;margin-top:0;border-radius:22px;box-shadow:0 18px 42px rgba(10,6,28,.42);}
body.mapping-popout-mode .mp-header{padding:20px 22px 16px;gap:14px;}
body.mapping-popout-mode .mp-header-label{font-size:11px;}
body.mapping-popout-mode .mp-header-status{font-size:27px;line-height:1.1;}
body.mapping-popout-mode .mp-open-window{display:none !important;}
body.mapping-popout-mode .mp-toggle{width:34px;height:34px;border-radius:10px;}
body.mapping-popout-mode .mp-toggle svg{width:14px;height:14px;}
body.mapping-popout-mode .mp-body{padding:8px 22px 22px;}
body.mapping-popout-mode .mp-section{padding:16px 0;}
body.mapping-popout-mode .mp-section-title{font-size:11px;margin-bottom:10px;}
body.mapping-popout-mode .mp-note{font-size:16px;line-height:1.6;}
body.mapping-popout-mode .mp-list{font-size:16px;line-height:1.7;padding-left:22px;}
body.mapping-popout-mode .mp-stat{padding:6px 12px;font-size:13px;}
body.mapping-popout-mode .mp-chip{padding:5px 11px;font-size:12px;}
body.mapping-popout-mode .mp-sheet-pair{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;}
body.mapping-popout-mode .mp-sheet-item{padding:12px 14px;border-radius:14px;}
body.mapping-popout-mode .mp-sheet-lbl,body.mapping-popout-mode .mp-sheet-cit-lbl{font-size:11px;}
body.mapping-popout-mode .mp-sheet-name{font-size:22px;line-height:1.35;}
body.mapping-popout-mode .mp-sheet-cit-val{font-size:42px;}
body.mapping-popout-mode .mp-error-rows{gap:8px;}
body.mapping-popout-mode .mp-error-row{padding:12px 14px;border-radius:14px;}
body.mapping-popout-mode .mp-error-row-num{font-size:11px;margin-bottom:6px;}
body.mapping-popout-mode .mp-error-row-issues{font-size:15px;line-height:1.55;}
body.mapping-popout-mode .mp-error-row-preview{font-size:13px;line-height:1.5;}
body.mapping-popout-mode .mp-success{padding:12px 14px;border-radius:14px;font-size:15px;line-height:1.55;}
```

**New (insert in the same spot, inside the same string literal — remember to escape quotes and keep it on one line as the existing block does):**

```text
body.mapping-popout-mode .mvp-panel{display:block !important;margin-top:0;border-radius:22px;box-shadow:0 18px 42px rgba(10,6,28,.42);}
body.mapping-popout-mode .mvp-banner{padding:20px 24px;gap:16px;}
body.mapping-popout-mode .mvp-banner-icon{width:44px;height:44px;font-size:20px;}
body.mapping-popout-mode .mvp-banner-title{font-size:24px;}
body.mapping-popout-mode .mvp-banner-sub{font-size:14px;margin-top:4px;}
body.mapping-popout-mode .mvp-open-window{display:none !important;}
body.mapping-popout-mode .mvp-toggle{width:34px;height:34px;border-radius:10px;}
body.mapping-popout-mode .mvp-toggle svg{width:14px;height:14px;}
body.mapping-popout-mode .mvp-tile{padding:20px 22px;}
body.mapping-popout-mode .mvp-tile-lbl{font-size:12px;}
body.mapping-popout-mode .mvp-tile-val{font-size:44px;margin-top:10px;}
body.mapping-popout-mode .mvp-tile-sub{font-size:13px;margin-top:6px;}
body.mapping-popout-mode .mvp-section{padding:18px 24px;}
body.mapping-popout-mode .mvp-section-head{font-size:13px;margin-bottom:12px;}
body.mapping-popout-mode .mvp-pill{font-size:12px;padding:3px 10px;}
body.mapping-popout-mode .mvp-chip{font-size:12px;padding:4px 11px;}
body.mapping-popout-mode .mvp-row{font-size:14px;padding:12px 14px;grid-template-columns:140px 1fr auto;}
body.mapping-popout-mode .mvp-row-tag{font-size:12px;}
body.mapping-popout-mode .mvp-more,body.mapping-popout-mode .mvp-empty{font-size:13px;}
```

The existing `.comparison-*` rules and the trailing `@media (max-width:720px)` block stay unchanged. Inside that media query, add one extra rule (the existing `.mp-sheet-pair` line can be removed since it no longer applies):

Find this line in the media query:

```text
body.mapping-popout-mode .mp-sheet-pair{grid-template-columns:1fr;}
```

Replace with:

```text
body.mapping-popout-mode .mvp-tiles{grid-template-columns:1fr;}body.mapping-popout-mode .mvp-row{grid-template-columns:1fr auto;}body.mapping-popout-mode .mvp-row-label{grid-column:1/-1;}
```

- [ ] **Step 4.3: Reload and open the popout window**

Reload `Main File.html`. Validate a workbook. Click "Open in window". Expected:
- Popout opens at 1480 × 960
- Panel renders with larger banner (24 px title, 44 px tile values)
- "Open in window" button is hidden inside the popout
- Resize the popout to ≤720 px wide → tiles stack to a single column, rows reflow

---

## Task 5: Remove the old `.mp-*` CSS block

**Files:**
- Modify: `Main File.html` — delete lines 518–519 and lines 632–738

**Rationale:** `.mp-*` classes are no longer emitted by `buildMappingPanelHtml` and no longer referenced by the popout CSS. Keeping the old rules adds dead bytes and risk of accidental re-use.

- [ ] **Step 5.1: Delete the orphan `.mp-panel` declaration**

Open `Main File.html`. Delete lines 518–519 (the two-line block):

```css
.mp-panel{font-size:14px;color:var(--text-soft);padding:14px 16px;background:var(--iv-500);border:1px solid var(--line);border-radius:var(--radius-xs);line-height:1.47}
.mp-panel:empty{display:none}
```

(After deletion, the blank line on old-line-517 should directly meet the next rule.)

- [ ] **Step 5.2: Delete the main `.mp-*` block**

Delete lines 632–738 (now shifted up by 2 because of the previous deletion — search for the comment `/* ========== MAPPING VALIDATION PANEL (mp-panel) ========== */` to locate it). Delete from that comment through the closing `}` of `.mp-success` (the last rule before the new `.mvp-*` block inserted in Task 1).

- [ ] **Step 5.3: Search for any lingering `.mp-*` references**

Run (from the project root):

```bash
grep -nE "\.mp-(panel|header|body|section|list|note|stat|chip|sheet|error-row|success|toggle|open-window|more)" "Main File.html"
```

Expected: no matches inside CSS rules. Acceptable matches (if any): the `.mp-open-window` / `.mp-toggle` compound selectors left in place in Task 3.1 / 3.2 — if preferred, those can be trimmed down now to just `.mvp-open-window` / `.mvp-toggle`:

In line 15659, change `.closest(".mvp-open-window, .mp-open-window")` → `.closest(".mvp-open-window")`.
In line 15669, change `.closest(".mvp-toggle, .mp-toggle")` → `.closest(".mvp-toggle")`.

- [ ] **Step 5.4: Reload and re-verify all four states**

Reload `Main File.html`. Repeat the quick checks from Task 2 (pending, invalid, valid, valid-with-advisories). Expected: no visual regressions, no console errors, no missing styles.

---

## Task 6: Final manual verification walkthrough

**Files:** None (verification only)

- [ ] **Step 6.1: Run the 7 test scenarios from the spec**

Open `Main File.html` in a browser, devtools open. For each scenario below, record: banner text, tile counts, section order, any console errors.

1. Upload a known-good mapping workbook → pending → valid (no advisories).
2. Upload a workbook missing the `K · SRC I` header → invalid → confirm the `Source headers` section shows a red-tinted "K · SRC I — not found" chip.
3. Upload a workbook with three CIT rows that fail rules (bad `L`, bad `Q`, bad `K`) → invalid → confirm `Row issues` section lists all three with correct `Sheet · row` labels.
4. Upload a workbook that validates with two advisories (blank `K` on a CIT row, missing `P`) → valid w/ advisories → confirm `Advisories` section shows two amber rows.
5. Re-upload while pending — confirm a fresh upload replaces the in-flight state cleanly (no leftover skeleton).
6. Toggle reduced motion in OS prefs (Windows: Settings → Accessibility → Visual effects → Animation effects off) → reload → confirm no shimmer, no section stagger.
7. Open popout window → confirm scaled typography matches spec §8 (24 px banner title, 44 px tile values, buttons hidden).

- [ ] **Step 6.2: Accessibility check**

With the browser's accessibility inspector (or a screen reader), verify:
- The banner reads as a `status` region; when the state changes, the new verdict is announced.
- The tile container during pending has `aria-busy="true"`.
- Both banner buttons (`Open in window`, collapse chevron) have meaningful `aria-label`s.

- [ ] **Step 6.3: Dead-code search**

Run from the project root:

```bash
grep -cE "mp-(panel|header|body|section|list|note|stat|chip|sheet|error-row|success)" "Main File.html"
```

Expected: `0`. If non-zero, find and delete the stragglers.

---

## Self-Review Notes

Cross-checked every spec section (§3 visual language, §4 states, §5 DOM, §6 motion, §7 copy, §8 popout, §9 affected code, §10 accessibility, §11 testing) against the task list — every item is covered:

- §3 → Task 1 CSS block
- §4 (all four states) → Task 2 builder + Task 2.2–2.5 verification
- §5 DOM structure → Task 2 HTML emission
- §6 motion (transitions, shimmer, stagger, reduced-motion) → Task 1 CSS keyframes + media query
- §7 copy → Task 2 banner string construction
- §8 popout recalibration → Task 4
- §9 affected code table → mapped 1:1 to Tasks 1–5
- §10 accessibility → Task 2 aria attributes, Task 6.2 check
- §11 testing → Task 6

No "TBD"s, no vague "handle edge cases", every code step shows complete code. Type names are consistent: `mvp-panel`, `mvp-banner`, `mvp-banner-icon`, `mvp-banner-text`, `mvp-banner-title`, `mvp-banner-sub`, `mvp-banner-actions`, `mvp-open-window`, `mvp-toggle`, `mvp-shimmer`, `mvp-tiles`, `mvp-tile`, `mvp-tile-lbl`, `mvp-tile-val` (with `.is-err`, `.is-skel`), `mvp-tile-sub`, `mvp-body`, `mvp-section`, `mvp-section-head`, `mvp-section-title`, `mvp-pill` (with `.is-err`, `.is-warn`, `.is-ok`), `mvp-chips`, `mvp-chip` (with `.is-miss`), `mvp-rows`, `mvp-row` (with `.is-err`, `.is-warn`), `mvp-row-label`, `mvp-row-msg`, `mvp-row-tag`, `mvp-more`, `mvp-empty`. Banner modifier classes: `.is-pending`, `.is-invalid`, `.is-valid`, `.is-valid-warn`. All match between CSS (Task 1) and DOM emission (Task 2).
