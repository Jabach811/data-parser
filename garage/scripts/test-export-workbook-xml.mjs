import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const htmlFileName = process.env.EXPORT_XML_HTML || "Main File - Dark.html";
const htmlPath = path.join(root, htmlFileName);
const html = fs.readFileSync(htmlPath, "utf8");

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start === -1) {
    throw new Error(`Could not find function ${name}`);
  }
  const bodyStart = html.indexOf("{", start);
  let depth = 0;
  for (let i = bodyStart; i < html.length; i += 1) {
    if (html[i] === "{") depth += 1;
    if (html[i] === "}") depth -= 1;
    if (depth === 0) {
      return html.slice(start, i + 1);
    }
  }
  throw new Error(`Could not extract function ${name}`);
}

function extractFunctionIfPresent(name) {
  return html.includes(`function ${name}(`) ? extractFunction(name) : "";
}

const sandbox = {};
vm.runInNewContext([
  "function trimValue(value) { return String(value == null ? '' : value).trim(); }",
  extractFunction("sanitizeXmlText"),
  extractFunction("escapeXml"),
  extractFunction("columnLetter"),
  extractFunction("excelSerialFromIsoDate"),
  extractFunction("worksheetRange"),
  extractFunction("exportColumnWidth"),
  extractFunction("worksheetColumnsFromFields"),
  extractFunction("workbookCell"),
  extractFunction("textCell"),
  extractFunction("numberCell"),
  extractFunction("formulaCell"),
  extractFunction("worksheetXml"),
  extractFunction("normalizeHeader"),
  extractFunction("getHeaderIndex"),
  extractFunction("getHeaderValueByCandidates"),
  extractFunction("parseAmountValue"),
  extractFunction("fieldHeaderMatchesAny"),
  extractFunction("getFieldByCandidates"),
  extractFunction("mergeSummaryFieldType"),
  "var currentMappingFileName = 'mapping.xlsx';",
  "var CIT_ELECTION_RULES = { NEWPORT: { reportCode: 'VA', participantHeaders: ['PART-TAX-ID'], sourceHeaders: ['CONTR-MONEY-TY-CODE', 'CONTR-MONEY-TY-CDE', 'CONTR-MONEY-TY-CD'], fundHeaders: ['PROV-EXT-INV-VH-ID'], percentHeaders: ['PART-ALLOCAT-RATE'] }, EMPOWER: { reportCode: 'ALLOC', participantHeaders: ['SSN'], sourceHeaders: ['MONEY TYPE'], fundHeaders: ['INVESTMENT OPTION'], percentHeaders: ['PERCENT'] } };",
  "var CIT_BALANCE_RULES = { NEWPORT: { reportCode: 'VA', participantHeaders: ['PART-TAX-ID'], sourceHeaders: ['CONTR-MONEY-TY-CODE', 'CONTR-MONEY-TY-CDE', 'CONTR-MONEY-TY-CD'], fundHeaders: ['PROV-EXT-INV-VH-ID'], amountHeaders: ['PART-ALLOCAT-AMT'] }, EMPOWER: { reportCode: 'BALANC', participantHeaders: ['SSN'], sourceHeaders: ['MONEY TYPE'], fundHeaders: ['INVESTMENT OPTION'], amountHeaders: ['AMOUNT'] } };",
  "function getSelectedSource() { return sourceMock; }",
  "function buildSummaryTotals() { return { fundTotals: [] }; }",
  "function buildCustomBalanceSheet() { return null; }",
  "function buildConvFileSheet() { return null; }",
  extractFunction("buildCITElectionsSheet"),
  extractFunction("buildCITBalancesSheet"),
  "function getReportName(source, code) { return source.reportNames[code] || code; }",
  extractFunctionIfPresent("exportStylesXml"),
  extractFunction("buildVendorSummarySheets"),
  extractFunction("buildWorkbookFiles"),
].join("\n"), sandbox);

const illegalXmlChars = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/;

const textXml = sandbox.textCell("A1", "EA email\u0007bad\u0000value & raw <tag>", 1);
assert.equal(illegalXmlChars.test(textXml), false, "export text cells must remove XML-forbidden control characters");
assert.match(textXml, /&amp;/, "export text cells must still XML-escape ampersands");
assert.match(textXml, /&lt;tag&gt;/, "export text cells must still XML-escape angle brackets");

const worksheet = sandbox.worksheetXml(
  [
    "<row r=\"1\">" + sandbox.textCell("A1", "Header", 6) + sandbox.textCell("B1", "Amount", 6) + "</row>",
    "<row r=\"2\">" + sandbox.textCell("A2", "Value", 1) + "<c r=\"B2\" s=\"3\"><v>123.45</v></c></row>"
  ],
  [
    "<col min=\"1\" max=\"1\" width=\"18\" bestFit=\"1\" customWidth=\"1\"/>",
    "<col min=\"2\" max=\"2\" width=\"14\" bestFit=\"1\" customWidth=\"1\"/>"
  ],
  { freezeTopRow: true, autoFilterRef: "A1:B2", dimensionRef: "A1:B2" }
);

assert.match(worksheet, /<dimension ref="A1:B2"\/>/, "worksheet XML should declare its used range");
assert.match(worksheet, /<autoFilter ref="A1:B2"\/>/, "worksheet XML should enable Excel filtering on exports");

const mergedWorksheet = sandbox.worksheetXml(
  [
    "<row r=\"2\">" + sandbox.textCell("B2", "Plan Name", 11) + sandbox.textCell("C2", "Example Plan", 12) + "</row>"
  ],
  [],
  { dimensionRef: "B2:E10", mergeRefs: ["C2:D2", "C3:D3", "C8:E8"] }
);
assert.match(mergedWorksheet, /<mergeCells count="3">/, "title page should support template merge cells");
assert.match(mergedWorksheet, /<mergeCell ref="C8:E8"\/>/, "title page should preserve the mapping-file merged value cell");

assert.match(html, /Aptos Narrow/, "export styles should use the template font");
assert.ok(
  html.includes('sz val=\\"14\\"') || html.includes('sz val="14"'),
  "export parameter styles should keep the template font size"
);
assert.match(html, /textCell\("B2", "Plan Name", 11\)/, "title page should start with Plan Name at B2");
assert.match(html, /textCell\("B3", "Case Number", 11\)/, "title page should put Case Number at B3");
assert.match(html, /textCell\("B5", "Data Source", 11\)/, "title page should put Data Source at B5");
assert.match(html, /textCell\("D5", "Total Reports", 11\)/, "title page should put Total Reports at D5");
assert.match(html, /textCell\("B10", "Report Code", 17\)/, "title page report table should start at B10");
assert.match(html, /dimensionRef: "B2:E" \+ titleLastRow/, "title page should use the template B:E range");
if (/v2/i.test(htmlFileName)) {
  assert.match(html, /function getCurrentExportPlanName\(\)/, "export should read the current plan name field at download time");
  assert.match(html, /var exportPlanName = getCurrentExportPlanName\(\);/, "download should capture the current plan name before building files");
  assert.match(html, /var exportResult = Object\.assign\(\{\}, lastParseResult, \{ planName: exportPlanName \}\);/, "download should pass the current plan name into workbook generation");
  assert.match(html, /safeFilePart\(exportPlanName, "Plan Name"\)/, "download filename should use the current plan name field");
}

sandbox.sourceMock = {
  key: "TEST",
  label: "Template Test Source",
  supportsExport: true,
  reports: ["EA", "77"],
  reportNames: {
    EA: "E-mail Address",
    "77": "Balances"
  }
};

const files = sandbox.buildWorkbookFiles({
  sourceLabel: "Template Test Source",
  currentFileName: "source-file.txt",
  planName: "Sample Plan",
  caseNumber: "T12345",
  foundReports: ["EA", "77"],
  grouped: {
    EA: [["sample@example.com"]],
    "77": [["123.45"], ["456.78"]]
  },
  layoutsByReport: {
    EA: [{ header: "Email", type: "text" }],
    "77": [{ header: "Balance", type: "decimal" }]
  }
}, null, "T12345", { status: "valid" });
const titleSheet = files.find((file) => file.path === "xl/worksheets/sheet1.xml").content;
assert.match(titleSheet, /<dimension ref="B2:E12"\/>/, "generated title sheet should use the template B:E range");
assert.match(titleSheet, /<mergeCell ref="C2:D2"\/>/, "generated title sheet should merge Plan Name value cells");
assert.match(titleSheet, /<c r="B2" t="inlineStr" s="11"><is><t>Plan Name<\/t><\/is><\/c>/, "generated title sheet should place Plan Name at B2");
assert.match(titleSheet, /<c r="B10" t="inlineStr" s="17"><is><t>Report Code<\/t><\/is><\/c>/, "generated title sheet should place report headers at B10:E10");
assert.match(titleSheet, /<c r="B11" t="inlineStr" s="18"><is><t>EA<\/t><\/is><\/c>/, "generated title sheet should list reports from row 11");

sandbox.sourceMock = {
  key: "FIDELITY",
  label: "FIDELITY",
  supportsExport: true,
  supportsBreakdown: true,
  reports: ["09", "09R", "70", "70R", "07DR", "18R", "37", "38", "40", "79"],
  reportNames: {
    "09": "Deferral Percentages",
    "09R": "Roth Deferral Percentages",
    "70": "Deferral Dollar Amounts",
    "70R": "Roth Deferral Dollar Amounts",
    "07DR": "Date of First Contribution Roth",
    "18R": "Roth Tax Cost Amounts",
    "37": "Loan Information",
    "38": "Loan Information",
    "40": "Delinquent Loan Information",
    "79": "Outstanding Loan Balances by Source"
  }
};

const fidelityFiles = sandbox.buildWorkbookFiles({
  sourceLabel: "FIDELITY",
  currentFileName: "fidelity.txt",
  planName: "Fidelity Plan",
  caseNumber: "T98765",
  foundReports: ["09", "18R", "37", "79"],
  grouped: {
    "09": [["12345", "111223333", "09", "5.5", "", "2.25"]],
    "07DR": [["12345", "", "111223333", "", "07", "D", "01", "2024-01-15", "", "Y"]],
    "18R": [["12345", "", "111223333", "", "18", "A", "100.25", "75.5", "", "", "", "Y"]],
    "37": [
      ["12345", "", "111223333", "", "37", "LN001", "1000", "5", "12", "M", "", "2024-02-01", ""],
      ["12345", "", "111223333", "", "37", "LN002", "2000", "6", "24", "B", "", "2024-06-01", ""]
    ],
    "38": [["12345", "", "111223333", "", "38", "LN001", "900", "F", "", "125", "P", "", "2024-03-01", "", "", "", ""]],
    "40": [["12345", "", "111223333", "", "40", "LN001", "Y", "2024-04-01", "2024-05-01", ""]],
    "79": [
      ["12345", "", "111223333", "", "79", "LN001", "", "", "", "01", "450", "", "R"],
      ["12345", "", "111223333", "", "79", "LN001", "", "", "", "02", "300", "", "R"],
      ["12345", "", "111223333", "", "79", "LN001", "", "", "", "03", "150", "", "R"],
      ["12345", "", "111223333", "", "79", "LN002", "", "", "", "02", "250", "", "R"]
    ]
  },
  layoutsByReport: {
    "09": [
      { header: "Plan Number", type: "text" },
      { header: "Social Security Number", type: "text" },
      { header: "Record Identifier", type: "text" },
      { header: "Before Tax Percentage", type: "decimal" },
      { header: "Filler", type: "text" },
      { header: "Catch-Up Election Pctg", type: "decimal" }
    ],
    "07DR": [
      { header: "Plan Number", type: "text" },
      { header: "Filler", type: "text" },
      { header: "Social Security Number", type: "text" },
      { header: "Filler", type: "text" },
      { header: "Record Identifier", type: "text" },
      { header: "Field Type", type: "text" },
      { header: "01 Field Number", type: "text" },
      { header: "Date Of 1st Roth Contribution", type: "date" },
      { header: "Filler", type: "text" },
      { header: "Roth Indicator", type: "text" }
    ],
    "18R": [
      { header: "Plan Number", type: "text" },
      { header: "Filler", type: "text" },
      { header: "Social Security Number", type: "text" },
      { header: "Filler", type: "text" },
      { header: "Record Identifier", type: "text" },
      { header: "Process Indicator", type: "text" },
      { header: "Roth Gross", type: "decimal" },
      { header: "Roth Rpt", type: "decimal" },
      { header: "Filler", type: "text" },
      { header: "Filler", type: "text" },
      { header: "Filler", type: "text" },
      { header: "Roth Indicator", type: "text" }
    ],
    "37": [
      { header: "Plan Number", type: "text" },
      { header: "Filler", type: "text" },
      { header: "Social Security Number", type: "text" },
      { header: "Filler", type: "text" },
      { header: "Record Identifier", type: "text" },
      { header: "Loan ID", type: "text" },
      { header: "Loan Amount", type: "decimal" },
      { header: "Interest Rate", type: "decimal" },
      { header: "Total # Of Payments", type: "text" },
      { header: "Payment Frequency", type: "text" },
      { header: "Zeros", type: "text" },
      { header: "Loan Date", type: "date" },
      { header: "Space", type: "text" }
    ],
    "38": [
      { header: "Plan Number", type: "text" },
      { header: "Filler", type: "text" },
      { header: "Social Security Number", type: "text" },
      { header: "Filler", type: "text" },
      { header: "Record Identifier", type: "text" },
      { header: "Loan ID", type: "text" },
      { header: "Principal Balance", type: "decimal" },
      { header: "Interest Type", type: "text" },
      { header: "Space", type: "text" },
      { header: "Regular Payment Amount", type: "decimal" }
    ],
    "40": [
      { header: "Plan Number", type: "text" },
      { header: "Filler", type: "text" },
      { header: "Social Security Number", type: "text" },
      { header: "Reserved", type: "text" },
      { header: "Record Identifier", type: "text" },
      { header: "Loan ID", type: "text" },
      { header: "Deemed Default Indicator", type: "text" },
      { header: "Default Date", type: "date" },
      { header: "Date Of First Post Default Repay", type: "date" },
      { header: "Filler", type: "text" }
    ],
    "79": [
      { header: "Plan Number", type: "text" },
      { header: "Filler", type: "text" },
      { header: "Social Security Number", type: "text" },
      { header: "Reserved", type: "text" },
      { header: "Record Identifier", type: "text" },
      { header: "Loan ID", type: "text" },
      { header: "Spaces", type: "text" },
      { header: "Spaces", type: "text" },
      { header: "Spaces", type: "text" },
      { header: "Source", type: "text" },
      { header: "Outstanding Loan Balance", type: "decimal" },
      { header: "Spaces", type: "text" },
      { header: "Reinvestment Type", type: "text" }
    ]
  }
}, null, "T98765", { status: "valid" });

const fidelityWorkbook = fidelityFiles.find((file) => file.path === "xl/workbook.xml").content;
assert.match(fidelityWorkbook, /name="Deferrals"/, "Fidelity export should include a Deferrals summary tab");
assert.match(fidelityWorkbook, /name="Roth Basis"/, "Fidelity export should include a Roth Basis summary tab");
assert.match(fidelityWorkbook, /name="Loan Header"/, "Fidelity export should include a Loan Header summary tab");
assert.match(fidelityWorkbook, /name="Loan Source"/, "Fidelity export should include a Loan Source summary tab");
const fidelityDeferralsSheet = fidelityFiles.find((file) => /sheet2\.xml$/.test(file.path)).content;
assert.match(fidelityDeferralsSheet, /Before Tax Percentage/, "Deferrals tab should pull Percentage headers");
assert.match(fidelityDeferralsSheet, /Catch-Up Election Pctg/, "Deferrals tab should pull Pctg headers");
assert.doesNotMatch(fidelityDeferralsSheet, /<t>Report Code<\/t>/, "Deferrals tab should not include Report Code");
assert.doesNotMatch(fidelityDeferralsSheet, /<t>Report Name<\/t>/, "Deferrals tab should not include Report Name");
assert.doesNotMatch(fidelityDeferralsSheet, /<t>Plan Number<\/t>/, "Deferrals tab should not include Plan Number");
assert.doesNotMatch(fidelityDeferralsSheet, /<t>Loan ID<\/t>/, "Deferrals tab should not include Loan ID");
const fidelityRothBasisSheet = fidelityFiles.find((file) => /sheet3\.xml$/.test(file.path)).content;
assert.match(fidelityRothBasisSheet, /Date of 1st Roth Contribution/, "Roth Basis tab should include the first Roth contribution date");
assert.match(fidelityRothBasisSheet, /Contribution Basis/, "Roth Basis tab should label Roth Rpt as Contribution Basis");
assert.equal((fidelityRothBasisSheet.match(/<row r="/g) || []).length, 2, "Roth Basis should consolidate 07DR and 18R into one row per SSN");
assert.doesNotMatch(fidelityRothBasisSheet, /<t>Report Code<\/t>/, "Roth Basis tab should not include Report Code");
assert.doesNotMatch(fidelityRothBasisSheet, /<t>Report Name<\/t>/, "Roth Basis tab should not include Report Name");
assert.doesNotMatch(fidelityRothBasisSheet, /<t>Plan Number<\/t>/, "Roth Basis tab should not include Plan Number");
assert.doesNotMatch(fidelityRothBasisSheet, /<t>Loan ID<\/t>/, "Roth Basis tab should not include Loan ID");
const fidelityLoanHeaderSheet = fidelityFiles.find((file) => /sheet4\.xml$/.test(file.path)).content;
assert.match(fidelityLoanHeaderSheet, /Regular Payment/, "Loan Header tab should include regular payment details");
assert.match(fidelityLoanHeaderSheet, /Default Date/, "Loan Header tab should include default dates");
assert.equal((fidelityLoanHeaderSheet.match(/<row r="/g) || []).length, 3, "Loan Header should consolidate 37, 38, and 40 into one row per SSN and loan id");
assert.match(fidelityLoanHeaderSheet, /<t>Index<\/t>/, "Loan Header tab should include an Index column");
assert.match(fidelityLoanHeaderSheet, /LN001/, "Loan Header tab should include the first loan id");
assert.match(fidelityLoanHeaderSheet, /LN002/, "Loan Header tab should include the second loan id");
assert.doesNotMatch(fidelityLoanHeaderSheet, /<t>Report Code<\/t>/, "Loan Header tab should not include Report Code");
assert.doesNotMatch(fidelityLoanHeaderSheet, /<t>Report Name<\/t>/, "Loan Header tab should not include Report Name");
assert.doesNotMatch(fidelityLoanHeaderSheet, /<t>Plan Number<\/t>/, "Loan Header tab should not include Plan Number");
const fidelityLoanSourceSheet = fidelityFiles.find((file) => /sheet5\.xml$/.test(file.path)).content;
assert.match(fidelityLoanSourceSheet, /Outstanding Loan Balance/, "Loan Source tab should include outstanding loan balance");
assert.match(fidelityLoanSourceSheet, /<t>Index<\/t>/, "Loan Source tab should include the mapped loan header Index");
assert.match(fidelityLoanSourceSheet, /<t>Social Security Number<\/t>/, "Loan Source tab should keep Social Security Number");
assert.equal((fidelityLoanSourceSheet.match(/<row r="/g) || []).length, 5, "Loan Source should keep one row per report 79 source line");
assert.equal((fidelityLoanSourceSheet.match(/<v>1<\/v>/g) || []).length, 3, "Loan Source should map every LN001 source line to index 1");
assert.match(fidelityLoanSourceSheet, /<v>2<\/v>/, "Loan Source tab should map LN002 to index 2");
assert.match(fidelityLoanSourceSheet, /<t>Source<\/t>/, "Loan Source tab should include Source");
assert.match(fidelityLoanSourceSheet, /<t>Outstanding Loan Balance<\/t>/, "Loan Source tab should include Outstanding Loan Balance");
assert.doesNotMatch(fidelityLoanSourceSheet, /<t>Report Code<\/t>/, "Loan Source tab should not include Report Code");
assert.doesNotMatch(fidelityLoanSourceSheet, /<t>Report Name<\/t>/, "Loan Source tab should not include Report Name");
assert.doesNotMatch(fidelityLoanSourceSheet, /<t>Plan Number<\/t>/, "Loan Source tab should not include Plan Number");
assert.doesNotMatch(fidelityLoanSourceSheet, /<t>Case Number<\/t>/, "Loan Source tab should not include Case Number");
assert.doesNotMatch(fidelityLoanSourceSheet, /<t>Loan ID<\/t>/, "Loan Source tab should not include Loan ID");

function buildVendorFiles(key, reports, grouped, layoutsByReport) {
  sandbox.sourceMock = {
    key,
    label: key,
    supportsExport: true,
    supportsBreakdown: true,
    reports,
    reportNames: Object.fromEntries(reports.map((report) => [report, report]))
  };
  return sandbox.buildWorkbookFiles({
    sourceLabel: key,
    currentFileName: `${key.toLowerCase()}.txt`,
    planName: `${key} Plan`,
    caseNumber: "T22222",
    foundReports: reports,
    grouped,
    layoutsByReport
  }, null, "T22222", { status: "valid" });
}

function sheet(files, sheetNumber) {
  return files.find((file) => new RegExp(`sheet${sheetNumber}\\.xml$`).test(file.path)).content;
}

function assertVendorFixture(fixture) {
  const files = buildVendorFiles(fixture.sourceKey, fixture.reports, fixture.grouped, fixture.layoutsByReport);
  const workbookXml = files.find((file) => file.path === "xl/workbook.xml").content;
  for (const tabName of fixture.expectedTabs || []) {
    assert.match(workbookXml, new RegExp(`name="${tabName}"`), `${fixture.sourceKey} export should include ${tabName}`);
  }
  for (const tabName of fixture.unexpectedTabs || []) {
    assert.doesNotMatch(workbookXml, new RegExp(`name="${tabName}"`), `${fixture.sourceKey} export should not include ${tabName}`);
  }
  for (const check of fixture.sheetChecks || []) {
    const content = sheet(files, check.sheetNumber);
    for (const text of check.includes || []) {
      assert.match(content, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${fixture.sourceKey} ${check.tab} should include ${text}`);
    }
    for (const text of check.excludes || []) {
      assert.doesNotMatch(content, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${fixture.sourceKey} ${check.tab} should not include ${text}`);
    }
    if (check.indexValue && check.indexCount != null) {
      const indexRegex = new RegExp(`<v>${check.indexValue}<\\/v>`, "g");
      assert.equal((content.match(indexRegex) || []).length, check.indexCount, `${fixture.sourceKey} ${check.tab} should map ${check.indexCount} row(s) to index ${check.indexValue}`);
    }
  }
}

const vendorFixtureDir = path.join(root, "garage/test-fixtures/vendor-summary-export");
const vendorFixtureFiles = fs.readdirSync(vendorFixtureDir)
  .filter((fileName) => fileName.endsWith(".json"))
  .sort();
assert.deepEqual(
  vendorFixtureFiles,
  [
    "adp.json",
    "empower.json",
    "fidelity.json",
    "nationwide.json",
    "newport.json",
    "oneamerica.json",
    "paychex.json",
    "principal.json",
    "vanguard.json"
  ],
  "vendor summary export fixtures should exist for every supported/limited vendor"
);
for (const fixtureFile of vendorFixtureFiles) {
  assertVendorFixture(JSON.parse(fs.readFileSync(path.join(vendorFixtureDir, fixtureFile), "utf8")));
}

const newportFiles = buildVendorFiles(
  "NEWPORT",
  ["PR", "PT", "LN", "LD", "HR", "MT", "VA"],
  {
    PR: [["111223333", "5.5", "0", "100", "0", "6", "125"]],
    PT: [["111223333", "2023-01-01", "200", "2023-12-31", "180", "50000", "2024-01-01", "2500", "2024-02-01", "900", "2024-02-01", "100", "2024-02-01", "200", "2023-12-31", "2600"]],
    LN: [["111223333", "L0001", "950", "2023-02-01", "1000", "50", "5.25", "M", "N", "2024-01-01"]],
    LD: [
      ["111223333", "L0001", "ER", "600", "150", "25"],
      ["111223333", "L0001", "EE", "350", "100", "15"]
    ],
    HR: [["111223333", "HRS", "2024", "1460", "2"]],
    MT: [["111223333", "ER", "1200", "100", "75"]],
    VA: [["111223333", "ER", "FND01", "600", "65"], ["111223333", "EE", "FND02", "350", "35"]]
  },
  {
    PR: [
      { header: "PART-TAX-ID", type: "text" },
      { header: "INI-PRE-TAX-ERL", type: "decimal" },
      { header: "INI-PST-TAX-ERL", type: "decimal" },
      { header: "INI-PRE-TAX-AT", type: "decimal" },
      { header: "INI-PST-TAX-AT", type: "decimal" },
      { header: "ROTH-EDFR-ERL-RT", type: "decimal" },
      { header: "ROTH-EDFR-ERL-AT", type: "decimal" }
    ],
    PT: [
      { header: "PART-TAX-ID", type: "text" },
      { header: "PLN-MT-FIR-CNB-DT", type: "date" },
      { header: "PYTD-ROTH-ELECTIVE-DEFERRAL-AT", type: "decimal" },
      { header: "PYTD-ROTH-EDFR-DT", type: "date" },
      { header: "ROTH-BASIS-AT", type: "decimal" },
      { header: "PLAN-YTD-SAL-AMT", type: "decimal" },
      { header: "PLAN-YR-SAL-UPD-DTE", type: "date" },
      { header: "PYTD-SALARY-DEDUCTION-AMT", type: "decimal" },
      { header: "PYTD-SALARY-DEDUCTION-DTE", type: "date" },
      { header: "PYTD-EMPLOYER-MATCH-MONEY-AMT", type: "decimal" },
      { header: "PYTD-EMPLOYER-MATCH-MONEY-DTE", type: "date" },
      { header: "PYTD-VOLUNTARY-MONEY-AMT", type: "decimal" },
      { header: "PYTD-VOLUNTARY-MONEY-DTE", type: "date" },
      { header: "PYTD-ROTH-ELECTIVE-DEFERRAL-AT", type: "decimal" },
      { header: "PYTD-ROTH-EDFR-DT", type: "date" },
      { header: "CALENDAR-YTD-SALARY-DDN-AT", type: "decimal" }
    ],
    LN: [
      { header: "PART-TAX-ID", type: "text" },
      { header: "PART-LOAN-EXTL-ID", type: "text" },
      { header: "LOAN-OUTSTAND-AMT", type: "decimal" },
      { header: "LOAN-START-DTE", type: "date" },
      { header: "ORIGINAL-LOAN-AMT", type: "decimal" },
      { header: "SKED-LN-RPYMNT-AMT", type: "decimal" },
      { header: "LOAN-ANNL-INT-RTE", type: "decimal" },
      { header: "LOAN-PYMT-FREQ-CDE", type: "text" },
      { header: "LOAN-DEEM-STAT-CDE", type: "text" },
      { header: "LST-LOAN-PYMNT-DTE", type: "date" }
    ],
    LD: [
      { header: "PART-TAX-ID", type: "text" },
      { header: "PART-LOAN-EXTL-ID", type: "text" },
      { header: "CONTR-MONEY-TY-CDE", type: "text" },
      { header: "LOAN-OUTSTAND-AMT", type: "decimal" },
      { header: "YTD-PRINCIPAL-PAID-AMT", type: "decimal" },
      { header: "YTD-INTEREST-PAID-AMT", type: "decimal" }
    ],
    HR: [
      { header: "PART-TAX-ID", type: "text" },
      { header: "TRACKING-TYPE-CDE", type: "text" },
      { header: "TRACKING-YEAR-DTE", type: "date" },
      { header: "YR-TO-DATE-HRS-AMT", type: "decimal" },
      { header: "VST-SERVICE-YR-CNT", type: "decimal" }
    ],
    MT: [
      { header: "PART-TAX-ID", type: "text" },
      { header: "CONTR-MONEY-TY-CDE", type: "text" },
      { header: "YTD-MONY-TYP-TOTAL-CONTRIB-AMT", type: "decimal" },
      { header: "YTD-MONY-TYP-TOTAL-DISTRIB-AMT", type: "decimal" },
      { header: "YTD-MONY-TYP-TOTAL-EARNING-AMT", type: "decimal" }
    ],
    VA: [
      { header: "PART-TAX-ID", type: "text" },
      { header: "CONTR-MONEY-TY-CDE", type: "text" },
      { header: "PROV-EXT-INV-VH-ID", type: "text" },
      { header: "PART-ALLOCAT-AMT", type: "decimal" },
      { header: "PART-ALLOCAT-RATE", type: "decimal" }
    ]
  }
);
const newportWorkbook = newportFiles.find((file) => file.path === "xl/workbook.xml").content;
assert.match(newportWorkbook, /name="Deferrals"/, "Newport export should include Deferrals");
assert.match(newportWorkbook, /name="Roth Basis"/, "Newport export should include Roth Basis");
assert.match(newportWorkbook, /name="Loan Header"/, "Newport export should include Loan Header");
assert.match(newportWorkbook, /name="Loan Source"/, "Newport export should include Loan Source");
assert.match(newportWorkbook, /name="YTD HR"/, "Newport export should include YTD HR");
assert.match(newportWorkbook, /name="YTD PT"/, "Newport export should include YTD PT");
assert.match(newportWorkbook, /name="YTD MT"/, "Newport export should include YTD MT");
assert.match(newportWorkbook, /name="YTD LD"/, "Newport export should include YTD LD");
assert.match(newportWorkbook, /name="CIT Balances"/, "Newport export should include CIT Balances");
assert.match(newportWorkbook, /name="CIT Elections"/, "Newport export should include CIT Elections");
assert.match(sheet(newportFiles, 2), /INI-PRE-TAX-ERL/, "Newport Deferrals should use PR election columns");
assert.match(sheet(newportFiles, 3), /ROTH-BASIS-AT/, "Newport Roth Basis should use PT Roth basis columns");
assert.equal((sheet(newportFiles, 5).match(/<v>1<\/v>/g) || []).length, 2, "Newport Loan Source should map both source rows to the Loan Header index");
assert.match(sheet(newportFiles, 5), /<t>Social Security Number<\/t>/, "Newport Loan Source should keep the participant id column under the standard output label");
assert.doesNotMatch(sheet(newportFiles, 5), /<t>Loan ID<\/t>/, "Newport Loan Source should hide the join-only loan id");
assert.match(sheet(newportFiles, 6), /YR-TO-DATE-HRS-AMT/, "Newport YTD HR should include hours fields");
assert.match(sheet(newportFiles, 7), /PLAN-YTD-SAL-AMT/, "Newport YTD PT should include salary fields");
assert.match(sheet(newportFiles, 8), /YTD-MONY-TYP-TOTAL-CONTRIB-AMT/, "Newport YTD MT should include money type totals");
assert.match(sheet(newportFiles, 9), /YTD-PRINCIPAL-PAID-AMT/, "Newport YTD LD should include loan YTD fields");
assert.match(sheet(newportFiles, 10), /<t>Amount<\/t>/, "Newport CIT Balances should use CIT balance format");
assert.match(sheet(newportFiles, 11), /<t>Percent<\/t>/, "Newport CIT Elections should use CIT election format");

const adpFiles = buildVendorFiles(
  "ADP",
  ["PH", "PF", "LH", "LF"],
  {
    PH: [["111223333", "4.0", "2.0", "2022-03-01", "275", "3", "1540"]],
    PF: [["111223333", "R", "75", "1250"]],
    LH: [["111223333", "101", "2023-01-01", "2023-02-01", "2023-01-15", "1000", "800", "6.5", "75", "2025-01-01", "0", "0"]],
    LF: [
      ["111223333", "R", "101", "700", "200", "25"],
      ["111223333", "E", "101", "300", "75", "10"]
    ]
  },
  {
    PH: [
      { header: "Social Security Number", type: "text" },
      { header: "Before-Tax Deferral Percent", type: "decimal" },
      { header: "Roth Deferral Percent", type: "decimal" },
      { header: "Roth First Contribution Date", type: "date" },
      { header: "ROTH TAX BASIS", type: "decimal" },
      { header: "Years of Service", type: "decimal" },
      { header: "Current Year-to-date Hours of Service", type: "decimal" }
    ],
    PF: [
      { header: "Social Security Number", type: "text" },
      { header: "Source ID", type: "text" },
      { header: "Contribution Allocation Percent", type: "decimal" },
      { header: "Gross Contributions Year-to-date", type: "decimal" }
    ],
    LH: [
      { header: "Social Security Number", type: "text" },
      { header: "Loan Number", type: "text" },
      { header: "Date of Loan Issue Date", type: "date" },
      { header: "Date of Next Loan Payment", type: "date" },
      { header: "Date of Previous Loan Payment", type: "date" },
      { header: "Loan Original Amount", type: "decimal" },
      { header: "Loan Balance Current", type: "decimal" },
      { header: "Loan Interest Rate", type: "decimal" },
      { header: "Loan Payment Amount", type: "decimal" },
      { header: "Loan Payoff Date", type: "date" },
      { header: "Principal in Arrears", type: "decimal" },
      { header: "Interest in Arrears", type: "decimal" }
    ],
    LF: [
      { header: "Social Security Number", type: "text" },
      { header: "Source ID", type: "text" },
      { header: "Loan Number", type: "text" },
      { header: "Original Loan Amount", type: "decimal" },
      { header: "Principal Amount Repaid", type: "decimal" },
      { header: "Interest Amount Repaid", type: "decimal" }
    ]
  }
);
assert.match(sheet(adpFiles, 2), /Before-Tax Deferral Percent/, "ADP Deferrals should use PH deferral percentages");
assert.match(sheet(adpFiles, 3), /ROTH TAX BASIS/, "ADP Roth Basis should use PH Roth basis fields");
assert.equal((sheet(adpFiles, 5).match(/<v>1<\/v>/g) || []).length, 2, "ADP Loan Source should map both LF rows to the LH index");
assert.match(sheet(adpFiles, 6), /Years of Service/, "ADP YOS should include Years of Service");
assert.match(sheet(adpFiles, 7), /Current Year-to-date Hours of Service/, "ADP YTD Hours should include YTD hours");

const empowerFiles = buildVendorFiles(
  "EMPOWER",
  ["DFRL", "ITD", "PYEB", "LOANS", "LOMNTY", "BALANC", "ALLOC"],
  {
    DFRL: [["111223333", "PRETAX", "2024-01-01", "6", "0", "2025-01-01"]],
    ITD: [["111223333", "RTH", "1250", "2022-03-01"]],
    PYEB: [["111223333", "COST", "275", "RTH", "275"]],
    LOANS: [["111223333", "LN001", "2024-02-01", "75", "1000", "800", "2026-01-01", "2024-01-15"]],
    LOMNTY: [["111223333", "LN001", "EE", "70", "2024-01-01"], ["111223333", "LN001", "ER", "30", "2024-01-01"]],
    BALANC: [["111223333", "RTH", "FND01", "1250"]],
    ALLOC: [["111223333", "RTH", "FND01", "100"]]
  },
  {
    DFRL: [
      { header: "SSN", type: "text" },
      { header: "DEFERRAL TYPE", type: "text" },
      { header: "EFFECTIVE DATE", type: "date" },
      { header: "DEFERRAL PERCENT", type: "decimal" },
      { header: "DEFERRAL AMOUNT", type: "decimal" },
      { header: "NEXT SCHEDULED CHANGE DATE", type: "date" }
    ],
    ITD: [
      { header: "SSN", type: "text" },
      { header: "MONEY TYPE", type: "text" },
      { header: "AMOUNT", type: "decimal" },
      { header: "ROTH FIRST CONTRIBUTION DATE", type: "date" }
    ],
    PYEB: [
      { header: "SSN", type: "text" },
      { header: "BASIS", type: "text" },
      { header: "VALUE", type: "decimal" },
      { header: "MONEY TYPE", type: "text" },
      { header: "BALANCE", type: "decimal" }
    ],
    LOANS: [
      { header: "SSN", type: "text" },
      { header: "LOAN NUMBER", type: "text" },
      { header: "FIRST DUE DATE", type: "date" },
      { header: "REPAY AMOUNT", type: "decimal" },
      { header: "ORIGINAL LOAN AMOUNT", type: "decimal" },
      { header: "OUTSTANDING PRINCIPAL", type: "decimal" },
      { header: "MATURITY DATE", type: "date" },
      { header: "LAST REPAYMENT DATE", type: "date" }
    ],
    LOMNTY: [
      { header: "SSN", type: "text" },
      { header: "LOAN NUMBER", type: "text" },
      { header: "MONEY TYPE", type: "text" },
      { header: "SPLIT PERCENT", type: "decimal" },
      { header: "EFFECTIVE DATE", type: "date" }
    ],
    BALANC: [
      { header: "SSN", type: "text" },
      { header: "MONEY TYPE", type: "text" },
      { header: "INVESTMENT OPTION", type: "text" },
      { header: "AMOUNT", type: "decimal" }
    ],
    ALLOC: [
      { header: "SSN", type: "text" },
      { header: "MONEY TYPE", type: "text" },
      { header: "INVESTMENT OPTION", type: "text" },
      { header: "PERCENT", type: "decimal" }
    ]
  }
);
const empowerWorkbook = empowerFiles.find((file) => file.path === "xl/workbook.xml").content;
assert.match(empowerWorkbook, /name="CIT Balances"/, "Empower export should include CIT Balances");
assert.match(empowerWorkbook, /name="CIT Elections"/, "Empower export should include CIT Elections");
assert.match(sheet(empowerFiles, 6), /<t>Amount<\/t>/, "Empower CIT Balances should use CIT balance format");
assert.match(sheet(empowerFiles, 7), /<t>Percent<\/t>/, "Empower CIT Elections should use CIT election format");

const paychexFiles = buildVendorFiles(
  "PAYCHEX",
  ["ELECTIONS", "LOAN_HEADER", "LOAN_SOURCE"],
  {
    ELECTIONS: [["111-22-3333", "AA", "E", "6", "2024-01-01"]],
    LOAN_HEADER: [["111-22-3333", "1", "001", "1000", "750", "2023-01-01", "6.25", "BIWEEKLY", "ACTIVE", "50", "2024-02-01", "2024-01-15"]],
    LOAN_SOURCE: [["111-22-3333", "E", "750", "-50", "2024-01-01"]]
  },
  {
    ELECTIONS: [
      { header: "Participant Id", type: "text" },
      { header: "Fund Code", type: "text" },
      { header: "Source Code", type: "text" },
      { header: "Percent", type: "decimal" },
      { header: "As Of Date", type: "date" }
    ],
    LOAN_HEADER: [
      { header: "Participant Id", type: "text" },
      { header: "Loan Number", type: "text" },
      { header: "Loan Payroll Number Code", type: "text" },
      { header: "Loan Amount", type: "decimal" },
      { header: "Loan Balance", type: "decimal" },
      { header: "Issuance Date", type: "date" },
      { header: "Interest Rate", type: "decimal" },
      { header: "Payment Frequency", type: "text" },
      { header: "Loan Status", type: "text" },
      { header: "Next Payment Amount", type: "decimal" },
      { header: "Next Payment Date", type: "date" },
      { header: "Last Payment Date", type: "date" }
    ],
    LOAN_SOURCE: [
      { header: "Participant Id", type: "text" },
      { header: "Source Code", type: "text" },
      { header: "Current Balance", type: "decimal" },
      { header: "Loans Activity", type: "decimal" },
      { header: "As Of Date", type: "date" }
    ]
  }
);
const paychexWorkbook = paychexFiles.find((file) => file.path === "xl/workbook.xml").content;
assert.match(paychexWorkbook, /name="Deferrals"/, "Paychex export should include Deferrals");
assert.doesNotMatch(paychexWorkbook, /name="Roth Basis"/, "Paychex export should not add a Roth Basis tab without source Roth fields");
assert.match(sheet(paychexFiles, 4), /Current Balance/, "Paychex Loan Source should include the available source balance field");

const vanguardFiles = buildVendorFiles(
  "VANGUARD",
  ["ELECTIONS", "LOAN_HEADER", "LOAN_SOURCE"],
  {
    ELECTIONS: [["111223333", "CURRENT", "EE", "PCT", "6", "0", "2024-01-01", "2024-01-31"]],
    LOAN_HEADER: [["111223333", "001", "1000", "750", "6.25", "2023-01-01", "2023-01-02", "2024-02-01", "2025-01-01", "50", "1", "6", "0", "0", "2024-01-31"]],
    LOAN_SOURCE: [
      ["111223333", "001", "EE", "500", "150", "2024-01-31"],
      ["111223333", "001", "ER", "250", "75", "2024-01-31"]
    ]
  },
  {
    ELECTIONS: [
      { header: "Participant Id", type: "text" },
      { header: "Election Type", type: "text" },
      { header: "Source Code", type: "text" },
      { header: "Value Type", type: "text" },
      { header: "Percent", type: "decimal" },
      { header: "Amount", type: "decimal" },
      { header: "Effective Date", type: "date" },
      { header: "As Of Date", type: "date" }
    ],
    LOAN_HEADER: [
      { header: "Participant Id", type: "text" },
      { header: "Loan Number", type: "text" },
      { header: "Original Loan Amount", type: "decimal" },
      { header: "Outstanding Loan Balance", type: "decimal" },
      { header: "Loan Interest Rate", type: "decimal" },
      { header: "Original Loan Issue Date", type: "date" },
      { header: "Vanguard Loan Issue Date", type: "date" },
      { header: "Next Scheduled Payment Date", type: "date" },
      { header: "Loan Payoff Date", type: "date" },
      { header: "Loan Payment Amount", type: "decimal" },
      { header: "Loan Repayment Option", type: "text" },
      { header: "Loan Repayment Frequency", type: "text" },
      { header: "Loan Use Flag", type: "text" },
      { header: "Loan Type Flag", type: "text" },
      { header: "As Of Date", type: "date" }
    ],
    LOAN_SOURCE: [
      { header: "Participant Id", type: "text" },
      { header: "Loan Number", type: "text" },
      { header: "Source Code", type: "text" },
      { header: "Loan Balance In Source", type: "decimal" },
      { header: "ITD Loan Principal Repaid", type: "decimal" },
      { header: "As Of Date", type: "date" }
    ]
  }
);
assert.match(sheet(vanguardFiles, 2), /Election Type/, "Vanguard Deferrals should use payroll election fields");
assert.equal((sheet(vanguardFiles, 4).match(/<v>1<\/v>/g) || []).length, 2, "Vanguard Loan Source should map both source rows to the Loan Header index");

console.log(`Export workbook XML checks passed for ${htmlFileName}.`);
