// Runs every vendor sample through Workbook Studio and compares the export with its known-good copy.
// npm test            check everything
// npm run test:update record the current results as the new known-good copies
// node run.js voya    check only cases whose name contains "voya"
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");
const XLSX = require("xlsx");

const ROOT = path.resolve(__dirname, "..");
const APP = pathToFileURL(path.join(ROOT, "Workbook Studio.html")).href;
const VENDOR = path.join(ROOT, "Test Samples", "Vendor Files");
const EXPECTED = path.join(__dirname, "expected");
const UPDATE = process.argv.includes("--update");
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith("--"))[0];

const CASES = [
  { name: "fidelity-summary", files: ["fidelity/FIDELITY_summary_tabs_mock.txt"] },
  { name: "fidelity-special-rollover", files: ["fidelity/FIDELITY_special_rollover_mock.txt"] },
  { name: "newport", files: ["newport/PME_vendor_summary_test.txt"] },
  { name: "nationwide", files: ["nationwide/NWI_vendor_summary_test.txt"] },
  { name: "adp", files: ["adp/123456_EXTRAC.txt", "adp/123456_REPORT.txt"] },
  { name: "empower", files: ["empower/d123456_test.txt", "empower/s123456_summary.txt"] },
  { name: "paychex", files: ["paychex/123456M.txt", "paychex/123456LN.txt"] },
  { name: "oneamerica", files: ["oneamerica/A12345PV.TXT", "oneamerica/A12345LN.TXT"] },
  { name: "oneamerica-final", files: ["oneamerica/G12345.FINAL.xlsx"] },
  { name: "vanguard", files: ["vanguard/ENTJ767_TEST.txt", "vanguard/ENTJ768_TEST-PAYROLL-PART.txt"] },
  { name: "voya", files: ["voya/EXTRACT_LH_123456.TXT", "voya/EXTRACT_LF_123456.TXT"] },
  { name: "principal", files: ["principal/1-12345 Principal Test.xlsx"] },
  { name: "ameritas", files: ["ameritas/Participant_Valuation.txt", "ameritas/Participant_Allocation_Base_Report.txt", "ameritas/Disbursement_Report.txt", "ameritas/Loan_Report.csv"] },
  { name: "broken-empty-file", files: [{ name: "empty.txt", buffer: Buffer.alloc(0) }] },
  { name: "broken-not-a-vendor-file", files: [{ name: "notes.txt", buffer: Buffer.from("Meeting notes\nCall Kim about the plan\nNothing to parse here\n") }] },
  { name: "broken-cut-off-fidelity", files: [{ name: "FIDELITY_cut_off.txt", buffer: cutOff("fidelity/FIDELITY_summary_tabs_mock.txt") }] }
];

// A real file whose lines are chopped short, like a download that stopped halfway.
function cutOff(file) {
  const text = fs.readFileSync(path.join(VENDOR, file), "utf8");
  return Buffer.from(text.split(/\r?\n/).map((line) => line.slice(0, 40)).join("\n"));
}

function inputFiles(files) {
  return files.map((f) => (typeof f === "string" ? path.join(VENDOR, f) : { name: f.name, mimeType: "text/plain", buffer: f.buffer }));
}

// Export dates and times change every run, so they are blanked before comparing.
const TODAY = new Date();
function steady(value) {
  const text = String(value);
  if (/\b\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)?\b/i.test(text) && /\d{4}|\d{1,2}\/\d{1,2}/.test(text)) return "<time>";
  const y = TODAY.getFullYear(), m = TODAY.getMonth() + 1, d = TODAY.getDate();
  const todayForms = [m + "/" + d + "/" + y, String(m).padStart(2, "0") + "/" + String(d).padStart(2, "0") + "/" + y, y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0")];
  return todayForms.some((t) => text.includes(t)) ? "<today>" : value;
}

function readWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheets = {};
  wb.SheetNames.forEach((name) => {
    sheets[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: "" }).map((row) => row.map(steady));
  });
  return { order: wb.SheetNames, sheets };
}

async function runCase(browser, test) {
  const page = await browser.newPage({ acceptDownloads: true });
  const problems = [];
  page.on("pageerror", (e) => problems.push("Page error: " + e.message));
  await page.goto(APP);
  await page.fill("#caseNumberInput", "AB1234567890");
  await page.fill("#planNameInput", "Test Plan");
  await page.setInputFiles("#fileInput", inputFiles(test.files));
  await page.waitForFunction(() => {
    const box = document.getElementById("loadingBox");
    return box.getAttribute("data-loading-state") === "complete" || document.getElementById("errorText").textContent.trim();
  }, null, { timeout: 60000 }).catch(() => problems.push("The file never finished loading."));
  await page.waitForTimeout(300);
  const result = {
    detected: (await page.textContent("#dpcDetected")).trim(),
    message: (await page.textContent("#errorText")).trim(),
    exportAllowed: !(await page.$eval("#exportWorkbookBtn", (b) => b.disabled))
  };
  if (result.exportAllowed) {
    await page.click("#exportWorkbookBtn");
    await page.waitForTimeout(500);
    if (await page.$("#dpcConvDialog[open]")) {
      await page.click("#dpcConvDialog [data-cv=skip]");
      await page.waitForTimeout(300);
    }
    await page.waitForSelector("#dpcExportDialog[open]");
    await page.evaluate(() => {
      const box = document.getElementById("dpcExportSeparate");
      if (box && box.checked) { box.checked = false; box.dispatchEvent(new Event("change", { bubbles: true })); }
    });
    const button = (await page.$eval("#dpcExportConfirm", (b) => b.disabled)) ? "#dpcExportOverride" : "#dpcExportConfirm";
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 60000 }), page.click(button)]);
    const workbook = readWorkbook(fs.readFileSync(await download.path()));
    result.sheetOrder = workbook.order;
    result.sheets = workbook.sheets;
  }
  await page.close();
  return { result, problems };
}

function differences(expected, actual) {
  const out = [];
  ["detected", "message", "exportAllowed"].forEach((key) => {
    if (JSON.stringify(expected[key]) !== JSON.stringify(actual[key])) out.push(key + " was " + JSON.stringify(expected[key]) + ", now " + JSON.stringify(actual[key]));
  });
  if (JSON.stringify(expected.sheetOrder) !== JSON.stringify(actual.sheetOrder)) {
    out.push("tabs were [" + (expected.sheetOrder || []).join(", ") + "], now [" + (actual.sheetOrder || []).join(", ") + "]");
  }
  const sheets = Object.keys(expected.sheets || {}).filter((name) => actual.sheets && actual.sheets[name]);
  sheets.forEach((name) => {
    const a = expected.sheets[name], b = actual.sheets[name];
    if (a.length !== b.length) out.push(name + ": " + a.length + " rows before, " + b.length + " now");
    let shown = 0;
    for (let r = 0; r < Math.max(a.length, b.length) && shown < 5; r++) {
      const ra = a[r] || [], rb = b[r] || [];
      for (let c = 0; c < Math.max(ra.length, rb.length) && shown < 5; c++) {
        const va = ra[c] === undefined ? "" : ra[c], vb = rb[c] === undefined ? "" : rb[c];
        if (JSON.stringify(va) !== JSON.stringify(vb)) {
          out.push(name + " row " + (r + 1) + ", column " + XLSX.utils.encode_col(c) + ' ("' + ((a[0] || [])[c] || "") + '"): was ' + JSON.stringify(va) + ", now " + JSON.stringify(vb));
          shown++;
        }
      }
    }
  });
  return out;
}

(async () => {
  fs.mkdirSync(EXPECTED, { recursive: true });
  const browser = await chromium.launch();
  let failed = 0;
  for (const test of CASES.filter((c) => !ONLY || c.name.includes(ONLY))) {
    const file = path.join(EXPECTED, test.name + ".json");
    const { result, problems } = await runCase(browser, test);
    const sheetCount = result.sheetOrder ? result.sheetOrder.length + " tabs" : "no export";
    if (UPDATE) {
      fs.writeFileSync(file, JSON.stringify(result, null, 1));
      console.log("RECORDED " + test.name + " (" + sheetCount + ")" + (problems.length ? " | " + problems.join(" | ") : ""));
      continue;
    }
    if (!fs.existsSync(file)) {
      failed++;
      console.log("MISSING  " + test.name + ": no known-good copy yet. Run npm run test:update after checking the output.");
      continue;
    }
    const diffs = problems.concat(differences(JSON.parse(fs.readFileSync(file, "utf8")), result));
    if (diffs.length) {
      failed++;
      console.log("CHANGED  " + test.name);
      diffs.forEach((d) => console.log("         " + d));
    } else {
      console.log("OK       " + test.name + " (" + sheetCount + ")");
    }
  }
  await browser.close();
  if (!UPDATE) console.log(failed ? "\n" + failed + " case(s) need a look." : "\nAll cases match.");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
