import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const htmlFileName = process.env.MAPPING_CONTRACT_HTML || "Main File - Dark.html";
const htmlPath = path.join(root, htmlFileName);
const html = fs.readFileSync(htmlPath, "utf8");

const scriptBlocks = Array.from(html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi));
for (let i = 0; i < scriptBlocks.length; i += 1) {
  try {
    new Function(scriptBlocks[i][1]);
  } catch (error) {
    console.error(`Inline script ${i + 1} failed to parse: ${error.message}`);
    process.exit(1);
  }
}

const fundMatcherSource = html.match(/function findFundMappingWorkbookSheet\(sheetNames\) \{[\s\S]*?\n  \}/);
let fundMatcherBehaviorPass = false;
if (fundMatcherSource) {
  const findFundMappingWorkbookSheet = new Function(`return (${fundMatcherSource[0]});`)();
  fundMatcherBehaviorPass =
    findFundMappingWorkbookSheet(["Source Mapping"]) === "" &&
    findFundMappingWorkbookSheet(["Plan Info", "Fund Map"]) === "Fund Map" &&
    findFundMappingWorkbookSheet(["Plan Info", "Fund Mapping"]) === "Fund Mapping";
}

const checks = [
  {
    name: "data source status bar removed from selected card",
    pass: !html.includes("<span class=\\\"source-card-status-text\\\">Source ready</span>"),
  },
  {
    name: "vendor icon is pinned to the top-left of the source card",
    pass: /\.source-card-face\{[^}]*align-items:flex-start[^}]*\}/.test(html) &&
      /\.source-card-icon-wrap\{[^}]*margin-top:0[^}]*\}/.test(html),
  },
  {
    name: "blue hover accent covers setup controls and select file icon",
    pass: html.includes(".source-card-trigger:hover") &&
      html.includes(".icon-input-row:hover") &&
      html.includes(".file-picker:hover .file-picker-icon") &&
      html.includes("color:var(--accent)"),
  },
  {
    name: "loading bar uses blue accent and kinetic animation pauses while active",
    pass: /\.loading-fill\{[^}]*var\(--accent\)/.test(html) &&
      /\.loading-box\.is-active \.loading-kinetic\{[^}]*animation-play-state:paused/.test(html),
  },
  {
    name: "discard flip card does not bloat KPI cards after hover",
    pass: /\.discard-flip-clip\{[^}]*height:100% !important[^}]*\}/.test(html) &&
      /\.kpi-canvas-side \.kpi-tile\{[^}]*min-height:0[^}]*\}/.test(html),
  },
  {
    name: "grand total card does not mention USD",
    pass: !html.includes("USD &mdash; updates live as records validate."),
  },
  {
    name: "breakdown cards scroll from the whole card and use larger text",
    pass: html.includes("function getFlipExpandedHeight") &&
      /\.breakdown-list\{[^}]*overflow:auto[^}]*\}/.test(html) &&
      /\.breakdown-list\{[^}]*font-size:16px/.test(html),
  },
  {
    name: "mapping workbook picker accepts xlsx and xlsm files",
    pass: html.includes('id="mappingFileInput"') &&
      html.includes('accept=".xlsx,.xlsm"') &&
      html.includes("not the expected .xlsx/.xlsm workbook structure"),
  },
  {
    name: "fund mapping only matches explicit fund mapping or fund map sheet names",
    pass: html.includes("Fund Mapping tab was not found; fund mapping checks will be skipped.") &&
      html.includes("function findFundMappingWorkbookSheet") &&
      html.includes("fund map") &&
      html.includes("var fundSheetName = findFundMappingWorkbookSheet") &&
      fundMatcherBehaviorPass &&
      !html.includes('var fundSheetName = findBestWorkbookSheet(sheets.map(function (sheet) { return sheet.name; }), "Fund Mapping");') &&
      !html.includes('errors.push("Missing Fund Mapping tab.");'),
  },
  {
    name: "source mapping template headers and optional loan hierarchy are accepted",
    pass: html.includes('{ index: 12, letter: "M", name: "Source Hierarchy - Loans"') &&
      html.includes("Order of Sources to be used for Hierarchy") &&
      html.includes('if (!priorSourceCode) issues.push("B must have a prior vendor source code");') &&
      html.includes('if (!isLongDigitString(srcIValue)) issues.push("K must be an internal source code with more than 10 digits");') &&
      html.includes('if (hierarchyRaw)') &&
      html.includes('M must be a positive whole number when populated') &&
      html.includes('if (hierarchyRowItems.length && missingHierarchyValues.length)') &&
      !html.includes('warnings.push(sheetLabel + " headers were found on row "') &&
      !html.includes('if (!isTextLikeValue(row[2])) issues.push("C must be text");') &&
      !html.includes('if (!isTextLikeValue(row[3])) issues.push("D must be text");') &&
      !html.includes('G contains line breaks') &&
      !html.includes('H must be a number or number%') &&
      !html.includes('L must be blank, Y, or N') &&
      !html.includes('P was not found in the Source I section') &&
      !html.includes('K was not found in the Source I section') &&
      !html.includes('Source I section was not found under Source Mapping. Source cross-check warnings will be skipped.'),
  },
  {
    name: "fund mapping column T is optional for current mapping workbooks",
    pass: !html.includes('{ index: 19, letter: "T", name: "Re-Registering (Yes/No)"') &&
      !html.includes('T must be Yes, No, or blank') &&
      html.includes('{ index: 16, letter: "Q", name: "Fund Descriptor Code"'),
  },
  {
    name: "report list and parsed reports use separate full-width rows",
    pass: /\.reports-canvas\{[^}]*grid-template-columns:minmax\(0,1fr\)[^}]*\}/.test(html) &&
      /\.report-list-grid\{[^}]*auto-fit[^}]*minmax\(260px,1fr\)/.test(html) &&
      /\.report-list-label\{[^}]*white-space:normal[^}]*overflow:visible[^}]*\}/.test(html) &&
      /\.reports-canvas-out\{[^}]*width:100%[^}]*\}/.test(html),
  },
  {
    name: "parsed report tables are contained and header-fit their columns",
    pass: html.includes("function reportColumnWidthCh") &&
      html.includes("<colgroup>") &&
      /#reportOutputs \.report-table-wrap table\{[^}]*width:max-content[^}]*min-width:0[^}]*table-layout:fixed/.test(html) &&
      /\.reports-canvas-list, \.reports-canvas-out\{[^}]*max-width:100%[^}]*min-width:0[^}]*overflow:hidden/.test(html),
  },
];

const failures = checks.filter((check) => !check.pass);
if (failures.length) {
  console.error("Contract checks failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log(`Passed ${checks.length} dark UI/mapping contract checks for ${htmlFileName}.`);
