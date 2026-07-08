import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const outputDir = path.join(repoRoot, "garage", "test-fixtures");

function writeRows(sheet, rows) {
  if (!rows.length) return;
  const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const normalized = rows.map((row) => {
    const next = row.slice();
    while (next.length < maxCols) next.push("");
    return next;
  });
  sheet.getRangeByIndexes(0, 0, normalized.length, maxCols).values = normalized;
}

async function saveWorkbook(workbook, fileName) {
  const output = await SpreadsheetFile.exportXlsx(workbook);
  const filePath = path.join(outputDir, fileName);
  await output.save(filePath);
  return filePath;
}

function sourceRow({
  filter = "CIT",
  priorCode = "",
  priorName = "",
  sourceType = "",
  mappedCode = "",
  mappedName = "",
  ref = "",
  ratio = "",
  note1 = "",
  note2 = "",
  srcI = "",
  yesNo = "",
  decimal = "",
  note3 = "",
  note4 = "",
  translation = "",
  amount = "",
} = {}) {
  return [
    filter,
    priorCode,
    priorName,
    sourceType,
    mappedCode,
    mappedName,
    ref,
    ratio,
    note1,
    note2,
    srcI,
    yesNo,
    decimal,
    note3,
    note4,
    translation,
    amount,
  ];
}

function fundRow({
  filter = "CIT",
  priorFund = "",
  split = "",
  rounding = "",
  takeover = "",
  fundAmount = "",
  ref = "",
  descriptor = "",
  reReg = "",
} = {}) {
  const row = new Array(20).fill("");
  row[0] = filter;
  row[1] = priorFund;
  row[2] = split;
  row[3] = rounding;
  row[4] = takeover;
  row[5] = fundAmount;
  row[6] = ref;
  row[16] = descriptor;
  row[19] = reReg;
  return row;
}

function sourceInfoRow({
  account = "",
  srcI = "",
  srcS = "",
  d = "",
  e = "",
  f = "",
  g = "",
  translation = "",
} = {}) {
  return [account, srcI, srcS, d, e, f, g, translation];
}

async function buildPrincipalImportFixture() {
  const workbook = Workbook.create();
  const sheet = workbook.worksheets.add("Account Value Data");
  writeRows(sheet, [
    ["Mock Principal import file for Data Parser mapping validation"],
    ["Rows intentionally include matched, missing, duplicate, and zero/blank-ish coverage cases."],
    [],
    ["EE SS#", "Contribution ID", "Investment", "End Balance", "Participant Name", "Fixture Note"],
    ["111223333", "SRC001", "FND001", 1250.25, "Avery Stone", "source/fund both mapped"],
    ["222334444", "SRC002", "FND002", 2200, "Blair Morgan", "source maps; fund duplicate in mapping"],
    ["333445555", "SRC003", "FND003", 0, "Casey Reed", "zero balance still produces coverage"],
    ["444556666", "SRC004", "FND004", 310.75, "Devon Lee", "source missing from mapping"],
    ["555667777", "SRC_DUP", "FND_DUP", 480.5, "Elliot Park", "duplicate source and fund mapping"],
    ["666778888", "SRC_ONLY_IMPORT", "FND_ONLY_IMPORT", 915.1, "Finley Quinn", "missing source and fund mapping"],
    ["777889999", "", "FND_BLANK_SOURCE", 140.35, "Gray Rowan", "blank source code path"],
    ["888990000", "SRC_TRANSLATION", "FND_NA_IGNORED", 760, "Harper Vale", "translation and ignored mapping row coverage"],
  ]);
  return saveWorkbook(workbook, "1-12345 Mapping Validation Import Fixture.xlsx");
}

async function buildMessyValidMappingFixture() {
  const workbook = Workbook.create();
  const source = workbook.worksheets.add("Source Mapping");
  const fund = workbook.worksheets.add("Fund Mapping");
  const notes = workbook.worksheets.add("Fixture Notes");

  writeRows(source, [
    ["Filter Code", "Prior Source Code", "Prior Source Name", "Source Type", "Mapped Source Code", "Mapped Source Name", "TR Ref No", "Source Split Percent", "Note I", "Note J", "SRC I", "Allow Override", "Decimal Field", "Note N", "Note O", "Translation Code", "Takeover Amount"],
    sourceRow({ priorCode: "SRC001", priorName: "Employee Deferral", sourceType: "EE", mappedCode: "TA01", mappedName: "Employee Deferral", ref: "SRC-REF-001", ratio: "100%", srcI: "123456789012", yesNo: "Y", decimal: "1.00", translation: "TRN001", amount: "$1250.25" }),
    sourceRow({ priorCode: "SRC002", priorName: "Employer Match", sourceType: "ER", mappedCode: "TA02", mappedName: "Employer Match", ref: "SRC-REF-002", ratio: "50", srcI: "123456789013", yesNo: "N", decimal: "2.5", translation: "TRN002", amount: "2200" }),
    sourceRow({ priorCode: "SRC003", priorName: "Roth", sourceType: "EE", mappedCode: "TA03", mappedName: "Roth", ref: "SRC-REF-003", ratio: "0%", srcI: "123456789014", yesNo: "", decimal: "", translation: "", amount: "" }),
    sourceRow({ priorCode: "SRC_DUP", priorName: "Duplicate A", sourceType: "EE", mappedCode: "TAD1", mappedName: "Duplicate Source A", ref: "SRC-REF-D1", ratio: "25%", srcI: "123456789015", yesNo: "Y", decimal: "3", translation: "TRNDUP", amount: "480.50" }),
    sourceRow({ priorCode: "SRC_DUP", priorName: "Duplicate B", sourceType: "EE", mappedCode: "TAD2", mappedName: "Duplicate Source B", ref: "SRC-REF-D2", ratio: "75%", srcI: "123456789016", yesNo: "N", decimal: "4", translation: "TRNDUP2", amount: "480.50" }),
    sourceRow({ priorCode: "SRC_TRANSLATION", priorName: "Translation Missing", sourceType: "EE", mappedCode: "TAT1", mappedName: "Translation Missing", ref: "SRC-REF-T", ratio: "100%", srcI: "123456789099", yesNo: "Y", decimal: "5", translation: "TRN_NOT_IN_SOURCE_I", amount: "760" }),
    sourceRow({ priorCode: "SRC_K_MISSING", priorName: "SRC I Blank With Support", sourceType: "EE", mappedCode: "TAK0", mappedName: "Blank SRC I", ref: "SRC-REF-K", ratio: "15%", srcI: "", yesNo: "Y", decimal: "6", translation: "TRN001", amount: "100" }),
    sourceRow({ priorCode: "SRC_MAPPING_ONLY", priorName: "Mapping Only", sourceType: "ER", mappedCode: "TAMO", mappedName: "No activity in import", ref: "SRC-REF-MO", ratio: "100%", srcI: "123456789017", yesNo: "N", decimal: "7", translation: "TRN003", amount: "0" }),
    sourceRow({ filter: "IGNORE", priorCode: "SRC_IGNORE", priorName: "Non CIT row", sourceType: "NA", mappedCode: "NA", mappedName: "Ignored by validator", ref: "", ratio: "", srcI: "", yesNo: "", decimal: "", translation: "", amount: "" }),
    [],
    ["ACCOUNT_NO", "SRC_I", "SRC_S", "D", "E", "F", "G", "TRANSLATION_C"],
    sourceInfoRow({ account: "ACCT-001", srcI: "123456789012", srcS: "EE", d: "D1", translation: "TRN001" }),
    sourceInfoRow({ account: "ACCT-002", srcI: "123456789013", srcS: "ER", e: "E1", translation: "TRN002" }),
    sourceInfoRow({ account: "ACCT-003", srcI: "123456789014", srcS: "", translation: "TRN003" }),
    sourceInfoRow({ account: "ACCT-DUP-A", srcI: "123456789015", srcS: "EE", d: "D2", translation: "TRNDUP" }),
    sourceInfoRow({ account: "ACCT-DUP-B", srcI: "123456789015", srcS: "EE", e: "E2", translation: "TRNDUP" }),
    sourceInfoRow({ account: "ACCT-BAD-SRCI", srcI: "12345", srcS: "EE", d: "D3", translation: "TRNBAD" }),
    sourceInfoRow({ account: "ACCT-BLANK-CDEF", srcI: "123456789018", srcS: "", translation: "TRNBLANK" }),
  ]);

  writeRows(fund, [
    ["Filter", "PR Fund Code", "Fund Split Percent", "Rounding IND", "Takeover Amt", "Fund Amount", "TR Ref No", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Fund Descriptor Code", "R", "S", "Re-Registering (Yes/No)"],
    fundRow({ priorFund: "FND001", split: "100%", rounding: "Y", takeover: "0", fundAmount: "1250.25", ref: "FND-REF-001", descriptor: "ABCD", reReg: "Yes" }),
    fundRow({ priorFund: "FND002", split: "50", rounding: "N", takeover: "100", fundAmount: "2200", ref: "FND-REF-002", descriptor: "WXYZ", reReg: "No" }),
    fundRow({ priorFund: "FND002", split: "50", rounding: "Y", takeover: "100", fundAmount: "2200", ref: "FND-REF-002B", descriptor: "WXY2", reReg: "Yes" }),
    fundRow({ priorFund: "FND003", split: "0%", rounding: "", takeover: "", fundAmount: "0", ref: "", descriptor: "", reReg: "" }),
    fundRow({ priorFund: "FND_DUP", split: "25%", rounding: "Y", takeover: "0", fundAmount: "480.50", ref: "FND-DUP-A", descriptor: "DUP1", reReg: "Yes" }),
    fundRow({ priorFund: "FND_DUP", split: "75%", rounding: "N", takeover: "0", fundAmount: "480.50", ref: "FND-DUP-B", descriptor: "DUP2", reReg: "No" }),
    fundRow({ priorFund: "FND_NA_IGNORED", split: "100%", rounding: "Y", takeover: "0", fundAmount: "760", ref: "FND-NA", descriptor: "NA", reReg: "No" }),
    fundRow({ priorFund: "FND_MAPPING_ONLY", split: "100%", rounding: "Y", takeover: "0", fundAmount: "0", ref: "FND-MO", descriptor: "MAPO", reReg: "No" }),
  ]);

  writeRows(notes, [
    ["Fixture", "Purpose"],
    ["1-12345 Mapping Validation Import Fixture.xlsx", "Principal import workbook with source/fund totals for reconciliation."],
    ["Mapping Validation - Valid Messy Fixture.xlsx", "Passes current mapping validation while surfacing warnings, advisories, duplicate mappings, missing import codes, mapping-only rows, and ignored NA fund rows."],
    ["Key behavior", "This workbook is meant for review-output design, not for blocking-rule testing."],
  ]);

  return saveWorkbook(workbook, "Mapping Validation - Valid Messy Fixture.xlsx");
}

async function buildInvalidMappingFixture() {
  const workbook = Workbook.create();
  const source = workbook.worksheets.add("Source Mapping");
  const fund = workbook.worksheets.add("Fund Mapping");
  const notes = workbook.worksheets.add("Fixture Notes");

  writeRows(source, [
    ["Filter Code", "Prior Source Code", "Prior Source Name", "Source Type", "Mapped Source Code", "Mapped Source Name", "TR Ref No", "Source Split Percent", "Note I", "Note J", "SRC I", "Allow Override", "Decimal Field", "Note N", "Note O", "Translation Code", "Takeover Amount"],
    sourceRow({ priorCode: "", priorName: "Missing prior source code", sourceType: "EE", mappedCode: "TA-BAD1", ref: "OK", ratio: "100%", srcI: "123456789012", yesNo: "Y", decimal: "1", amount: "10" }),
    sourceRow({ priorCode: "SRC_BAD_C", priorName: "", sourceType: "EE", mappedCode: "TA-BAD2", ref: "OK", ratio: "50%", srcI: "123456789013", yesNo: "N", decimal: "2", amount: "20" }),
    sourceRow({ priorCode: "SRC_BAD_D", priorName: "Missing source type", sourceType: "", mappedCode: "TA-BAD3", ref: "OK", ratio: "25%", srcI: "123456789014", yesNo: "Y", decimal: "3", amount: "30" }),
    sourceRow({ priorCode: "SRC_BAD_G", priorName: "Line Break Ref", sourceType: "EE", ref: "Line one\nLine two", ratio: "25%", srcI: "123456789015", yesNo: "Y", decimal: "4", amount: "40" }),
    sourceRow({ priorCode: "SRC_BAD_H", priorName: "Bad Percent", sourceType: "EE", ref: "OK", ratio: "half", srcI: "123456789016", yesNo: "Y", decimal: "5", amount: "50" }),
    sourceRow({ priorCode: "SRC_BAD_K", priorName: "Bad SRC I", sourceType: "EE", ref: "OK", ratio: "100%", srcI: "12345", yesNo: "Y", decimal: "6", amount: "60" }),
    sourceRow({ priorCode: "SRC_BAD_L", priorName: "Bad Yes No", sourceType: "EE", ref: "OK", ratio: "100%", srcI: "123456789017", yesNo: "Maybe", decimal: "7", amount: "70" }),
    sourceRow({ priorCode: "SRC_BAD_M", priorName: "Bad Decimal", sourceType: "EE", ref: "OK", ratio: "100%", srcI: "123456789018", yesNo: "Y", decimal: "one", amount: "80" }),
    sourceRow({ priorCode: "SRC_BAD_Q", priorName: "Bad Currency", sourceType: "EE", ref: "OK", ratio: "100%", srcI: "123456789019", yesNo: "Y", decimal: "9", amount: "money" }),
    [],
    ["ACCOUNT_NO", "SRC_I", "SRC_S", "D", "E", "F", "G", "TRANSLATION_C"],
    sourceInfoRow({ account: "ACCT-VALID", srcI: "123456789012", srcS: "EE", d: "D1", translation: "TRN001" }),
  ]);

  writeRows(fund, [
    ["Filter", "PR Fund Code", "Fund Split Percent", "Rounding IND", "Takeover Amt", "Fund Amount", "TR Ref No", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Fund Descriptor Code", "R", "S", "Re-Registering (Yes/No)"],
    fundRow({ priorFund: "", split: "100%", rounding: "Y", takeover: "0", fundAmount: "10", ref: "OK", descriptor: "ABCD", reReg: "Yes" }),
    fundRow({ priorFund: "FND_BAD_C", split: "all", rounding: "Y", takeover: "0", fundAmount: "10", ref: "OK", descriptor: "ABCD", reReg: "Yes" }),
    fundRow({ priorFund: "FND_BAD_D", split: "100%", rounding: "Maybe", takeover: "0", fundAmount: "10", ref: "OK", descriptor: "ABCD", reReg: "Yes" }),
    fundRow({ priorFund: "FND_BAD_E", split: "100%", rounding: "Y", takeover: "one", fundAmount: "10", ref: "OK", descriptor: "ABCD", reReg: "Yes" }),
    fundRow({ priorFund: "FND_BAD_F", split: "100%", rounding: "Y", takeover: "0", fundAmount: "ten", ref: "OK", descriptor: "ABCD", reReg: "Yes" }),
    fundRow({ priorFund: "FND_BAD_Q", split: "100%", rounding: "Y", takeover: "0", fundAmount: "10", ref: "OK", descriptor: "TOO-LONG", reReg: "Yes" }),
    fundRow({ priorFund: "FND_BAD_T", split: "100%", rounding: "Y", takeover: "0", fundAmount: "10", ref: "OK", descriptor: "ABCD", reReg: "Maybe" }),
  ]);

  writeRows(notes, [
    ["Fixture", "Purpose"],
    ["Mapping Validation - Invalid Row Errors Fixture.xlsx", "Trips current hard row-level validation errors while keeping sheet names and headers valid enough for row validation to run."],
    ["Expected result", "Validation failed."],
  ]);

  return saveWorkbook(workbook, "Mapping Validation - Invalid Row Errors Fixture.xlsx");
}

async function buildInvalidHeaderMappingFixture() {
  const workbook = Workbook.create();
  const source = workbook.worksheets.add("Source Mapping");
  const fund = workbook.worksheets.add("Fund Mapping");
  const notes = workbook.worksheets.add("Fixture Notes");

  writeRows(source, [
    ["Wrong Filter", "Old Source", "Old Source Label", "Source Type", "Mapped Source Code", "Mapped Source Name", "TR Ref No", "Source Split Percent", "Note I", "Note J", "Wrong Source I"],
    sourceRow({ priorCode: "SRC001", priorName: "Employee Deferral", sourceType: "EE", srcI: "123456789012" }),
  ]);

  writeRows(fund, [
    ["Wrong Filter", "Old Fund", "Split Amount", "Round Flag", "Takeover Dollars", "Fund Dollars", "Reference", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Descriptor", "R", "S", "Register Again"],
    fundRow({ priorFund: "FND001", split: "100%", rounding: "Y", takeover: "0", fundAmount: "1250.25", ref: "FND-REF-001", descriptor: "ABCD", reReg: "Yes" }),
  ]);

  writeRows(notes, [
    ["Fixture", "Purpose"],
    ["Mapping Validation - Invalid Header Fixture.xlsx", "Trips current required-header validation while keeping the expected sheet names present."],
    ["Expected result", "Validation failed before row-level validation runs."],
  ]);

  return saveWorkbook(workbook, "Mapping Validation - Invalid Header Fixture.xlsx");
}

async function buildMissingTabsMappingFixture() {
  const workbook = Workbook.create();
  const sheet = workbook.worksheets.add("Not A Mapping Workbook");
  writeRows(sheet, [
    ["Fixture", "Purpose"],
    ["Mapping Validation - Missing Tabs Fixture.xlsx", "Trips missing Source Mapping and Fund Mapping tab errors."],
    ["Expected result", "Validation failed before sheet parsing."],
  ]);
  return saveWorkbook(workbook, "Mapping Validation - Missing Tabs Fixture.xlsx");
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const files = [];
  files.push(await buildPrincipalImportFixture());
  files.push(await buildMessyValidMappingFixture());
  files.push(await buildInvalidMappingFixture());
  files.push(await buildInvalidHeaderMappingFixture());
  files.push(await buildMissingTabsMappingFixture());
  console.log(files.join("\n"));
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
