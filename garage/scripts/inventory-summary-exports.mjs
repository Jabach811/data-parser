import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const htmlPath = path.join(root, "Main File.html");
const html = fs.readFileSync(htmlPath, "utf8");

function balancedAfter(startIndex) {
  const open = html.indexOf("{", startIndex);
  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;
  for (let i = open; i < html.length; i += 1) {
    const ch = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        inString = false;
      }
      continue;
    }
    if (ch === "\"" || ch === "'" || ch === "`") {
      inString = true;
      quote = ch;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return html.slice(open, i + 1);
    }
  }
  throw new Error("Could not find balanced object.");
}

function extractVarObject(varName) {
  const start = html.indexOf(`var ${varName} =`);
  if (start === -1) throw new Error(`Missing ${varName}`);
  return vm.runInNewContext(`(${balancedAfter(start)})`, {});
}

function extractSpecsBySource() {
  const fnStart = html.indexOf("function buildVendorSummarySheets(");
  if (fnStart === -1) throw new Error("Missing buildVendorSummarySheets");
  const varStart = html.indexOf("var specsBySource =", fnStart);
  if (varStart === -1) throw new Error("Missing specsBySource");
  return vm.runInNewContext(`(${balancedAfter(varStart)})`, {});
}

function addPrincipalSummaryRule(summaryRules) {
  const assignStart = html.indexOf("SUMMARY_RULES.PRINCIPAL =");
  if (assignStart !== -1) {
    summaryRules.PRINCIPAL = vm.runInNewContext(`(${balancedAfter(assignStart)})`, {});
  }
}

function outputColumnsForSpec(spec) {
  const base = [
    "Case Number",
    "Report Code",
    "Report Name",
    "Plan Number",
    "Social Security Number",
    "Loan ID"
  ];
  const omitted = new Set(spec.omitBaseHeaders || []);
  const output = [];
  for (const header of base) {
    if (!omitted.has(header)) output.push(header);
    if (header === "Case Number" && (spec.includeIndex || spec.includeMappedIndex)) output.push("Index");
  }
  if (spec.headerContains) {
    output.push(`Dynamic fields containing: ${spec.headerContains.join(", ")}`);
  } else {
    for (const report of spec.reports || []) {
      for (const field of spec.fieldsByReport?.[report] || []) {
        if (!output.includes(field.output)) output.push(field.output);
      }
    }
  }
  return output;
}

const specsBySource = extractSpecsBySource();
const summaryRules = extractVarObject("SUMMARY_RULES");
addPrincipalSummaryRule(summaryRules);
const citElectionRules = extractVarObject("CIT_ELECTION_RULES");
const citBalanceRules = extractVarObject("CIT_BALANCE_RULES");

const sources = Array.from(new Set([
  ...Object.keys(summaryRules),
  ...Object.keys(specsBySource),
  ...Object.keys(citElectionRules),
  ...Object.keys(citBalanceRules)
])).sort();

for (const source of sources) {
  console.log(`## ${source}`);
  if (summaryRules[source]) {
    console.log(`- Balance Export (${summaryRules[source].reportCode}): Case Number | Region | SSN | Source | Fund | Total`);
  }
  console.log("- CONV FILE (mapping-driven): Case Number | Prior Fund Code | TA Fund Code | Total | Ref Number | Source I | Re Reg");
  for (const spec of specsBySource[source] || []) {
    console.log(`- ${spec.name} (${(spec.reports || []).join(", ")}): ${outputColumnsForSpec(spec).join(" | ")}`);
  }
  if (citBalanceRules[source]) {
    const report = citBalanceRules[source].reportCode || "none";
    console.log(`- CIT Balances (${report}): Case Number | SSN | Source ID | Fund ID | Amount`);
  }
  if (citElectionRules[source]) {
    const report = citElectionRules[source].reportCode || "none";
    console.log(`- CIT Elections (${report}): Case Number | SSN | Source ID | Fund ID | Percent | Default`);
  }
  console.log("");
}
