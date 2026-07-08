import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixturePath = path.join(root, "garage", "test-fixtures", "export-mock", "empower-rich-export.json");
const outputDir = path.join(root, "garage", "outputs", "empower-export-mock");

const palette = {
  ink: "#172033",
  muted: "#5C6678",
  navy: "#163A5F",
  blue: "#245B8F",
  surface: "#F5F7FA",
  panel: "#FFFFFF",
  line: "#D8DEE8",
  header: "#E6F0F8",
  green: "#147A63",
  greenSoft: "#DFF3EC",
  amberSoft: "#FBE8D0"
};

function colLetter(index) {
  let result = "";
  let n = index + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    result = String.fromCharCode(65 + r) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function cell(row, col) {
  return `${colLetter(col)}${row}`;
}

function rangeAddress(startRow, startCol, rowCount, colCount) {
  return `${cell(startRow, startCol)}:${cell(startRow + rowCount - 1, startCol + colCount - 1)}`;
}

function safeTableName(name) {
  return name.replace(/[^A-Za-z0-9_]/g, "_").replace(/^([0-9])/, "_$1").slice(0, 48);
}

function toCellValue(header, value) {
  if (value == null || value === "") return null;
  if (/sequence/i.test(header)) return Number(value);
  if (/date|effective|maturity|repayment|scheduled/i.test(header)) return new Date(`${value}T00:00:00`);
  return value;
}

function setWidths(sheet, widths, rows = 80) {
  widths.forEach((width, index) => {
    const letter = colLetter(index);
    sheet.getRange(`${letter}1:${letter}${rows}`).format.columnWidthPx = width;
  });
}

function formatColumns(sheet, startRow, startCol, headers, rowCount) {
  headers.forEach((header, index) => {
    const letter = colLetter(startCol + index);
    const dataRange = sheet.getRange(`${letter}${startRow + 1}:${letter}${startRow + Math.max(rowCount, 1)}`);
    if (/date|effective|maturity|repayment|scheduled/i.test(header)) {
      dataRange.setNumberFormat("yyyy-mm-dd");
    } else if (/sequence/i.test(header)) {
      dataRange.setNumberFormat("0000");
    } else if (/amount|balance|principal|contribution|basis|repay|original|value/i.test(header)) {
      dataRange.setNumberFormat("$#,##0.00");
    } else if (/percent|share/i.test(header)) {
      dataRange.setNumberFormat("0.00");
    }
  });
}

function addTable(sheet, startRow, startCol, headers, rows, tableName, options = {}) {
  const converted = rows.map((row) => row.map((value, index) => toCellValue(headers[index], value)));
  const values = [headers, ...converted];
  const address = rangeAddress(startRow, startCol, values.length, headers.length);
  sheet.getRange(address).values = values;

  const headerRange = sheet.getRange(rangeAddress(startRow, startCol, 1, headers.length));
  headerRange.format = {
    fill: options.dark ? palette.navy : palette.header,
    font: { bold: true, color: options.dark ? "#FFFFFF" : palette.ink },
    borders: { preset: "all", style: "thin", color: palette.line },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true
  };

  if (rows.length) {
    sheet.getRange(rangeAddress(startRow + 1, startCol, rows.length, headers.length)).format = {
      fill: palette.panel,
      font: { color: palette.ink, fontSize: 10 },
      borders: { preset: "all", style: "thin", color: palette.line },
      verticalAlignment: "center"
    };
  }

  try {
    const table = sheet.tables.add(address, true, safeTableName(tableName));
    table.style = options.dark ? "TableStyleMedium2" : "TableStyleLight9";
    table.showFilterButton = true;
  } catch {
    // Styled range still works if the runtime cannot create a table for a range.
  }

  formatColumns(sheet, startRow, startCol, headers, rows.length);
  return address;
}

function mergeLabel(sheet, address, value, format) {
  const range = sheet.getRange(address);
  range.merge();
  range.values = [[value]];
  range.format = format;
}

function totalBalance(reports) {
  const balances = reports.find((report) => report.tab === "CIT Balances");
  return balances.rows.reduce((sum, row) => sum + Number(row[5] || 0), 0);
}

function uniqueValues(reports, index) {
  const values = new Set();
  reports.forEach((report) => report.rows.forEach((row) => values.add(row[index])));
  return Array.from(values).filter(Boolean);
}

function groupedTotal(report, keyIndex, valueIndex) {
  const totals = new Map();
  report.rows.forEach((row) => {
    totals.set(row[keyIndex], (totals.get(row[keyIndex]) || 0) + Number(row[valueIndex] || 0));
  });
  return Array.from(totals.entries());
}

function addMetric(sheet, address, label, value, fill) {
  const startCol = address.match(/[A-Z]+/)[0];
  const startRow = Number(address.match(/\d+/)[0]);
  const colIndex = startCol.charCodeAt(0) - 65;
  const block = sheet.getRange(`${address}:${colLetter(colIndex + 1)}${startRow + 1}`);
  block.merge(true);
  block.values = [[label], [value]];
  block.format = {
    fill,
    font: { color: palette.ink },
    borders: { preset: "outside", style: "thin", color: palette.line },
    horizontalAlignment: "center",
    verticalAlignment: "center"
  };
  sheet.getRange(`${address}:${colLetter(colIndex + 1)}${startRow}`).format = {
    fill,
    font: { bold: true, color: palette.muted, fontSize: 10 },
    horizontalAlignment: "center"
  };
  sheet.getRange(`${colLetter(colIndex)}${startRow + 1}:${colLetter(colIndex + 1)}${startRow + 1}`).format = {
    fill,
    font: { bold: true, color: palette.ink, fontSize: 16 },
    horizontalAlignment: "center"
  };
}

function buildFullParseWorkbook(fixture) {
  const workbook = Workbook.create();
  fixture.reports.forEach((report) => {
    const sheet = workbook.worksheets.add(report.code.replace("/", "-"));
    sheet.showGridLines = false;
    setWidths(sheet, report.headers.map((header) => {
      if (/participant/i.test(header)) return 150;
      if (/date|scheduled|effective|maturity/i.test(header)) return 128;
      if (/amount|balance|principal|contribution|basis/i.test(header)) return 135;
      return Math.min(Math.max(header.length * 8, 92), 180);
    }), Math.max(report.rows.length + 8, 40));
    addTable(sheet, 1, 0, report.headers, report.rows, `${report.code}Raw`);
    sheet.getRange(rangeAddress(1, 0, 1, report.headers.length)).format.rowHeightPx = 30;
  });
  return workbook;
}

function buildSummaryWorkbook(fixture) {
  const workbook = Workbook.create();
  const reports = fixture.reports;
  const meta = fixture.metadata;
  const balances = reports.find((report) => report.tab === "CIT Balances");
  const elections = reports.find((report) => report.tab === "CIT Elections");
  const balanceTotal = totalBalance(reports);
  const sourceBreakdown = groupedTotal(balances, 2, 5).map(([source, amount]) => [source, amount, amount / balanceTotal]);
  const fundBreakdown = groupedTotal(balances, 4, 5).map(([fund, amount]) => [fund, amount, amount / balanceTotal]);

  const summary = workbook.worksheets.add("Summary");
  summary.showGridLines = false;
  setWidths(summary, [34, 140, 190, 235, 300, 92, 92, 140, 130, 90, 34, 140, 130, 90], 80);

  mergeLabel(summary, "B2:J3", "Empower Secondary Export", {
    fill: palette.navy,
    font: { bold: true, color: "#FFFFFF", fontSize: 22 },
    horizontalAlignment: "left",
    verticalAlignment: "center"
  });
  mergeLabel(summary, "B4:J4", `${meta.planName} | ${meta.caseNumber} | ${meta.mappingStatus}`, {
    fill: palette.blue,
    font: { color: "#FFFFFF", fontSize: 11 },
    horizontalAlignment: "left",
    verticalAlignment: "center"
  });

  addMetric(summary, "B6", "Total Balance", balanceTotal, palette.amberSoft);
  summary.getRange("B7:C7").setNumberFormat("$#,##0");
  addMetric(summary, "D6", "Participants", uniqueValues(reports, 0).length, "#EAF1FB");
  addMetric(summary, "F6", "Source Types", sourceBreakdown.length, palette.greenSoft);
  addMetric(summary, "H6", "Funds", fundBreakdown.length, "#F0F4F8");

  const breakdownRows = [
    ["Balances", "BALANC", "Participant money type/fund balances", "Source, fund, and amount totals"],
    ["Deferrals", "DFRL", "Current deferral election values", "Percent and flat-dollar elections"],
    ["Roth Basis", "ITD / PYEB", "Roth contribution and basis values", "Roth first contribution date and basis"],
    ["Loan Header", "LOANS", "Loan-level repayment details", "Outstanding principal and maturity"],
    ["Loan Source", "LOMNTY", "Loan money type split", "EE/ER split percentages"],
    ["CIT Elections", "ALLOC", "Fund election percentages", "Allocation percentages by fund"]
  ];
  addTable(summary, 10, 1, ["Output", "Source Report", "What It Contains", "Review Focus"], breakdownRows, "ReportBreakdown", { dark: true });

  addTable(summary, 10, 7, ["Source", "Balance", "Share"], sourceBreakdown, "SourceBreakdown", { dark: true });
  addTable(summary, 17, 7, ["Fund", "Balance", "Share"], fundBreakdown, "FundBreakdown", { dark: true });
  summary.getRange("I11:I30").setNumberFormat("$#,##0.00");
  summary.getRange("J11:J30").setNumberFormat("0.0%");

  mergeLabel(summary, "B26:E26", "Review Notes", {
    fill: palette.header,
    font: { bold: true, color: palette.ink },
    horizontalAlignment: "left",
    verticalAlignment: "center"
  });
  summary.getRange("B27:E29").values = [
    ["Separate File", "Raw full-parse report tabs stay in the separate full parse file.", null, null],
    ["Reconcile First", "Use the source and fund breakdowns to check totals before sending downstream.", null, null],
    ["Standard Tabs", "Data tabs in this workbook also start at A1 with no metadata rows.", null, null]
  ];
  summary.getRange("C27:E29").merge(true);
  summary.getRange("B27:E29").format = {
    fill: palette.panel,
    font: { color: palette.muted, fontSize: 10 },
    borders: { preset: "all", style: "thin", color: palette.line },
    wrapText: true,
    verticalAlignment: "center"
  };
  summary.getRange("B27:B29").format = {
    fill: palette.surface,
    font: { bold: true, color: palette.ink, fontSize: 10 },
    borders: { preset: "all", style: "thin", color: palette.line },
    verticalAlignment: "center"
  };

  const secondaryTabs = [
    balances,
    reports.find((report) => report.tab === "Deferrals"),
    reports.find((report) => report.tab === "Roth Basis"),
    reports.find((report) => report.tab === "Loan Header"),
    reports.find((report) => report.tab === "Loan Source"),
    elections
  ];

  secondaryTabs.forEach((report) => {
    const sheet = workbook.worksheets.add(report.tab);
    sheet.showGridLines = false;
    setWidths(sheet, report.headers.map((header) => {
      if (/participant/i.test(header)) return 150;
      if (/date|scheduled|effective|maturity/i.test(header)) return 128;
      if (/amount|balance|principal|contribution|basis/i.test(header)) return 135;
      return Math.min(Math.max(header.length * 8, 92), 180);
    }), Math.max(report.rows.length + 8, 40));
    addTable(sheet, 1, 0, report.headers, report.rows, `${report.tab}Export`);
    sheet.getRange(rangeAddress(1, 0, 1, report.headers.length)).format.rowHeightPx = 30;
  });

  return workbook;
}

async function saveWorkbook(workbook, filename) {
  const outputPath = path.join(outputDir, filename);
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(outputPath);
  return outputPath;
}

async function renderPreview(workbook, sheetName, filename) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(path.join(outputDir, filename), new Uint8Array(await preview.arrayBuffer()));
}

async function verifyWorkbook(outputPath) {
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(outputPath));
  const errors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 100 },
    maxChars: 4000
  });
  return errors.ndjson;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const fixture = JSON.parse(await fs.readFile(fixturePath, "utf8"));

  const fullParse = buildFullParseWorkbook(fixture);
  const summary = buildSummaryWorkbook(fixture);

  await renderPreview(fullParse, "DFRL", "Full-Parse-DFRL.png");
  await renderPreview(summary, "Summary", "Secondary-Summary.png");
  await renderPreview(summary, "CIT Balances", "Secondary-CIT-Balances.png");

  const fullParsePath = await saveWorkbook(fullParse, "Empower Full Parse - Standard.xlsx");
  const summaryPath = await saveWorkbook(summary, "Empower Secondary Export - Summary.xlsx");

  const fullErrors = await verifyWorkbook(fullParsePath);
  const summaryErrors = await verifyWorkbook(summaryPath);

  const verification = {
    fullParsePath,
    summaryPath,
    fullErrors,
    summaryErrors
  };
  await fs.writeFile(path.join(outputDir, "v2-verification.json"), JSON.stringify(verification, null, 2), "utf8");
  console.log(JSON.stringify(verification, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
