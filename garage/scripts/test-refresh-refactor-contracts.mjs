import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = process.env.REFRESH_CONSOLE_HTML || "Workbook Console - Source refresh.html";
const htmlPath = path.resolve(root, target);
const html = fs.readFileSync(htmlPath, "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function findFunctionBody(name) {
  const start = html.indexOf(`function ${name}`);
  assert(start > -1, `Missing function ${name}`);
  const open = html.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < html.length; i += 1) {
    if (html[i] === "{") depth += 1;
    if (html[i] === "}") depth -= 1;
    if (depth === 0) return html.slice(open + 1, i);
  }
  throw new Error(`Could not read function body for ${name}`);
}

const expectedSources = [
  "NEWPORT",
  "FIDELITY",
  "VOYA",
  "PAYCHEX",
  "ONEAMERICA",
  "VANGUARD",
  "EMPOWER",
  "ADP",
  "NATIONWIDE",
  "PRINCIPAL"
];

for (const key of expectedSources) {
  const configAnchor = new RegExp(`(?:${key}:\\s*\\{|CONFIG\\.${key}\\s*=|key:\\s*"${key}")`);
  assert(configAnchor.test(html), `Missing CONFIG-owned block for ${key}`);
}

assert(/cardMeta\s*:/.test(html), "Source card metadata should live on source config blocks");
assert(/fileAccept\s*:/.test(html), "Accepted file extensions should live on source config blocks");
assert(/filePickerHelpText\s*:/.test(html), "File picker help text should live on source config blocks");
assert(/inputMode\s*:/.test(html), "Input mode should be declared on source config blocks");
assert(/normalizers\s*:/.test(html), "Per-source normalization rules should be declared on source config blocks");

const selectedSourceStart = html.indexOf("function getSelectedSource()");
const selectedSourceEnd = html.indexOf("function isFolderModeSource", selectedSourceStart);
assert(selectedSourceStart > -1 && selectedSourceEnd > selectedSourceStart, "Could not isolate getSelectedSource region");
const selectedSourceBody = html.slice(selectedSourceStart, selectedSourceEnd);
for (const prop of ["cardMeta", "fileAccept", "filePickerHelpText", "inputMode", "normalizers"]) {
  assert(selectedSourceBody.includes(prop), `getSelectedSource should expose ${prop}`);
}

const acceptBody = findFunctionBody("getFileAcceptForSource");
assert(!/source\.key\s*===/.test(acceptBody), "getFileAcceptForSource should not branch on source.key");
assert(/source\.fileAccept/.test(acceptBody), "getFileAcceptForSource should read source.fileAccept");

const helpBody = findFunctionBody("getSourceFilePickerHelpText");
assert(!/source\.key\s*===/.test(helpBody), "getSourceFilePickerHelpText should not branch on source.key");
assert(/source\.filePickerHelpText/.test(helpBody), "getSourceFilePickerHelpText should read source.filePickerHelpText");

const cardMetaBody = findFunctionBody("getSourceCardMeta");
assert(!/SOURCE_CARD_META/.test(cardMetaBody), "getSourceCardMeta should read CONFIG-owned cardMeta");

const normalizeLineBody = findFunctionBody("normalizeLineForSource");
assert(!/source\.key\s*===/.test(normalizeLineBody), "normalizeLineForSource should use config normalizers");

const normalizeSummaryBody = findFunctionBody("normalizeSummaryCodeForSource");
assert(!/source\.key\s*===/.test(normalizeSummaryBody), "normalizeSummaryCodeForSource should use config normalizers");

assert(/function createTextParsingToolkit/.test(html), "Missing shared text parsing toolkit");
assert((html.match(/createTextParsingToolkit\(/g) || []).length >= 4, "Paychex, OneAmerica, and Vanguard should use the shared text parsing toolkit");

assert(/POP_OUT_BASE_CSS/.test(html), "Missing shared pop-out base CSS");
assert(/COMPARISON_POP_OUT_CSS/.test(html), "Missing comparison pop-out CSS helper");
assert(/MAPPING_POP_OUT_CSS/.test(html), "Missing mapping pop-out CSS helper");
assert(/function collectPageStyleText/.test(html), "Missing shared pop-out style collector");
assert(/function buildPopoutDocumentHtml/.test(html), "Missing shared pop-out document builder");

console.log(`Refresh refactor contracts passed for ${target}`);
