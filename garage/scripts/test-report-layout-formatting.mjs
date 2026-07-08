import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(new URL("../../Main File.html", import.meta.url), "utf8");

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

function extractFidelityConfig() {
  const marker = "window.FIDELITY_SOURCE_CONFIG = ";
  const start = html.indexOf(marker);
  if (start === -1) {
    throw new Error("Could not find Fidelity config");
  }
  const objectStart = start + marker.length;
  let depth = 0;
  for (let i = objectStart; i < html.length; i += 1) {
    if (html[i] === "{") depth += 1;
    if (html[i] === "}") depth -= 1;
    if (depth === 0) {
      return html.slice(start, i + 2);
    }
  }
  throw new Error("Could not extract Fidelity config");
}

const sandbox = { window: {} };
vm.runInNewContext(
  [
    "function trimValue(value) { return String(value == null ? '' : value).trim(); }",
    extractFunction("isValidIsoDate"),
    extractFunction("formatEightDigitDate"),
    extractFunction("applyFieldFormatOptions"),
    extractFunction("decodeSignedNumeric"),
    extractFunction("formatCleanValue"),
    extractFunction("formatValue"),
    extractFidelityConfig(),
  ].join("\n"),
  sandbox
);

const { FIDELITY_SOURCE_CONFIG: fidelity } = sandbox.window;

assert.equal(fidelity.reportNames["09"], "Deferral Percentages");
assert.equal(fidelity.reportNames["18"], "Pre-87 and Post-86 After-tax Cost Amounts");
assert.equal(fidelity.reportNames["37"], "Loan Information");
assert.ok(fidelity.reports.includes("09RPRIOR"));

function fieldByHeader(reportCode, header, occurrence = 1) {
  const fields = fidelity.layouts[reportCode] || [];
  let seen = 0;
  for (const field of fields) {
    if (field.header === header) {
      seen += 1;
      if (seen === occurrence) {
        return field;
      }
    }
  }
  throw new Error(`Could not find ${reportCode} / ${header} #${occurrence}`);
}

function formatField(reportCode, header, raw, occurrence = 1) {
  const field = fieldByHeader(reportCode, header, occurrence);
  return sandbox.formatCleanValue(raw, field.type, field);
}

assert.equal(sandbox.formatCleanValue("01022026", "date"), "2026-01-02");
assert.equal(sandbox.formatCleanValue("12312026", "date"), "2026-12-31");
assert.equal(sandbox.formatCleanValue("2026-01-02", "date"), "2026-01-02");
assert.equal(sandbox.formatCleanValue("20260102", "date"), "2026-01-02");
assert.equal(sandbox.formatCleanValue("00000000", "date"), "");
assert.equal(sandbox.formatCleanValue("219E", "decimal", { signedLastChar: true, valueDivisor: 100 }), "21.95");
assert.equal(sandbox.formatCleanValue("219N", "decimal", { signedLastChar: true, valueDivisor: 100 }), "-21.95");
assert.equal(sandbox.formatCleanValue("219{", "decimal", { signedLastChar: true, valueDivisor: 100 }), "21.90");
assert.equal(sandbox.formatCleanValue("219}", "decimal", { signedLastChar: true, valueDivisor: 100 }), "-21.90");

assert.equal(formatField("09", "Before Tax Percentage", "01234"), "12.34");
assert.equal(formatField("09", "After Tax Percentage", "05678"), "56.78");
assert.equal(formatField("09PRIOR", "Prior Before Tax Percentage", "01234"), "12.34");
assert.equal(formatField("09PRIOR", "Prior After Tax Percentage", "05678"), "56.78");
assert.equal(formatField("09RPRIOR", "Prior Roth Percentage", "01234"), "12.34");

assert.equal(formatField("10", "Investment Election", "01234"), "12.34");
assert.equal(formatField("10", "Liquidation Election", "05678"), "56.78");
assert.equal(formatField("44", "Vesting Modifier # 1", "0012E"), "12.50");

assert.equal(formatField("15", "Amount", "1234567890X"), "12345678.90");
assert.equal(formatField("18", "Post 86-Gross", "0000012345X"), "123.45");
assert.equal(formatField("18", "Post 86-Rpt", "0000056789X"), "567.89");
assert.equal(formatField("18", "Pre 87-Gross", "0000000042X"), "0.42");
assert.equal(formatField("18", "Pre 87-Rpt", "0000000100X"), "1.00");
assert.equal(formatField("37", "Loan Amount", "12345678X"), "123456.78");
assert.equal(formatField("37", "Interest Rate", "1234"), "12.34");
assert.equal(formatField("38", "Principal Balance", "12345678X"), "123456.78");
assert.equal(formatField("38", "Regular Payment Amount", "00000123Z"), "1.23");
assert.equal(formatField("41", "Taxable Deemed Amount", "0000012345X"), "123.45");
assert.equal(formatField("41", "Non Taxable Deemed Amount", "0000056789X"), "567.89");
assert.equal(formatField("41", "Post Default Interst Amount", "0000000042X"), "0.42");

const summaryRulesStart = html.indexOf("var SUMMARY_RULES = ");
assert.notEqual(summaryRulesStart, -1, "Could not find summary rules");
const fidelitySummaryRuleMatch = html.slice(summaryRulesStart).match(/FIDELITY:\s*\{[\s\S]*?amountHeaders:\s*\[[^\]]+\]\s*\}/);
assert.ok(fidelitySummaryRuleMatch, "Could not find Fidelity summary rule");
const fidelitySummaryRule = fidelitySummaryRuleMatch[0];
assert.match(fidelitySummaryRule, /reportCode:\s*"77"/);
assert.match(fidelitySummaryRule, /sourceHeaders:\s*\["Source"\]/);
assert.match(fidelitySummaryRule, /fundHeaders:\s*\["Fund Symbol"\]/);
assert.match(fidelitySummaryRule, /amountHeaders:\s*\["Cash\/Market Value"\]/);

assert.equal(formatField("77", "Source", "03"), "03");
assert.equal(formatField("77", "Fund Symbol", "ABCD"), "ABCD");
assert.equal(formatField("77", "Cash/Market Value", "0000012345X"), "123.45");

console.log("Report layout formatting checks passed.");
