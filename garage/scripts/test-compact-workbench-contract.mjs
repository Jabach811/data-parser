import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const target = process.argv[2] || "Workbook Console - Compact Workbench.html";
const htmlPath = path.resolve(root, target);

const SOURCE_KEYS = [
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

const REQUIRED_DOM_IDS = [
  "acceptedLinesText",
  "caseNumberInput",
  "caseNumberMessage",
  "clearCustomReportsBtn",
  "comparisonResults",
  "comparisonStatus",
  "comparisonSummary",
  "dataSourceCardBadge",
  "dataSourceCardChips",
  "dataSourceCardIcon",
  "dataSourceCardMeta",
  "dataSourceCardOptions",
  "dataSourceCardSelect",
  "dataSourceCardStatus",
  "dataSourceCardTitle",
  "dataSourceCardTrigger",
  "dataSourceSelect",
  "discardedLinesText",
  "discardFlipClip",
  "discardFlipWrap",
  "discardText",
  "errorText",
  "exportWorkbookBtn",
  "fileInput",
  "fileInputBlock",
  "filePickerButtonText",
  "filePickerText",
  "fundBreakdownClip",
  "fundBreakdownText",
  "fundCountText",
  "fundFlipWrap",
  "grandTotalText",
  "inputModeNote",
  "loadingBox",
  "loadingFill",
  "loadingNote",
  "loadingPercent",
  "loadingTitle",
  "mappingFileInput",
  "mappingImportBtn",
  "mappingValidationPanel",
  "navStatus",
  "participantCountText",
  "payloadInput",
  "planNameInput",
  "reportOutputs",
  "sourceBreakdownClip",
  "sourceBreakdownText",
  "sourceCountText",
  "sourceDetails",
  "sourceFlipWrap",
  "summaryValidationPanel",
  "totalLinesText"
];

const REQUIRED_FUNCTIONS = [
  "getSelectedSource",
  "getFileAcceptForSource",
  "getSourceFilePickerHelpText",
  "usesSelectedFileSet",
  "resolveRecordForSource",
  "parsePayload",
  "parseSelectedFilesPayload",
  "renderParse",
  "parsePaychexFolderSource",
  "parseOneAmericaFolderSource",
  "parseVanguardFolderSource",
  "parseEmpowerFolderSource",
  "parseAdpFolderSource",
  "parseNationwideFolderSource",
  "parseNewportFolderSource",
  "parsePrincipalWorkbookFolder",
  "handleMappingFileChange",
  "validateMappingWorkbook",
  "validateMappingSheet",
  "validateSourceMappingRows",
  "validateFundMappingRows",
  "renderComparisonPanel",
  "readZipEntries",
  "parseWorkbookSheets",
  "parseWorksheetRows",
  "downloadWorkbookForReports",
  "downloadWorkbook",
  "downloadSingleReport",
  "buildWorkbookFiles",
  "createZip",
  "triggerWorkbookDownload"
];

const RUNTIME_MARKERS = [
  "data:font/woff2;base64",
  "function readZipEntries",
  "function parseWorkbookSheets",
  "function parseWorksheetRows",
  "function createZip",
  "function extractPdfTextLegacy"
];

const BASELINE_PDF_FALLBACK_URLS = new Set([
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js"
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasId(html, id) {
  const idPattern = new RegExp(`\\bid\\s*=\\s*(["'])${escapeRegExp(id)}\\1`, "i");
  return idPattern.test(html);
}

function hasFunction(html, name) {
  const functionPattern = new RegExp(`(?:async\\s+)?function\\s+${escapeRegExp(name)}\\s*\\(`);
  return functionPattern.test(html);
}

function sourceIsRegistered(html, sourceKey) {
  const configStart = html.indexOf("var CONFIG = {");
  const directConfigKey = new RegExp(`\\b${escapeRegExp(sourceKey)}\\s*:\\s*\\{`, "g");
  const assignedConfigKey = new RegExp(`\\bCONFIG\\.${escapeRegExp(sourceKey)}\\s*=`, "g");
  let match;

  while ((match = directConfigKey.exec(html))) {
    if (match.index > configStart) {
      return true;
    }
  }
  return assignedConfigKey.test(html);
}

function findExternalRuntimeReferences(html) {
  const references = new Set();
  const addIfExternal = (value) => {
    if (/^https?:\/\//i.test(value) && !BASELINE_PDF_FALLBACK_URLS.has(value)) {
      references.add(value);
    }
  };

  for (const match of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1[^>]*>/gi)) {
    addIfExternal(match[2]);
  }
  for (const linkMatch of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = linkMatch[0];
    const relMatch = tag.match(/\brel\s*=\s*(["'])(.*?)\1/i);
    const hrefMatch = tag.match(/\bhref\s*=\s*(["'])(.*?)\1/i);
    if (relMatch && /(?:^|\s)stylesheet(?:\s|$)/i.test(relMatch[2]) && hrefMatch) {
      addIfExternal(hrefMatch[2]);
    }
  }
  for (const match of html.matchAll(/@import\s+(?:url\(\s*)?(["']?)(https?:\/\/[^\s)"']+)\1/gi)) {
    addIfExternal(match[2]);
  }
  for (const match of html.matchAll(/\bimport(?:\s+[^;]*?\s+from)?\s*(["'])(https?:\/\/[^"']+)\1/g)) {
    addIfExternal(match[2]);
  }
  for (const match of html.matchAll(/\.src\s*=\s*(["'])(https?:\/\/[^"']+)\1/g)) {
    addIfExternal(match[2]);
  }

  return [...references].sort();
}

function outputAndExit(result) {
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = result.passed ? 0 : 1;
}

if (!fs.existsSync(htmlPath)) {
  outputAndExit({
    passed: false,
    sourceCount: 0,
    missingIds: [],
    externalRuntimeReferences: [],
    error: `Target file does not exist: ${target}`
  });
} else {
  const html = fs.readFileSync(htmlPath, "utf8");
  const missingIds = REQUIRED_DOM_IDS.filter((id) => !hasId(html, id));
  const sourceCount = SOURCE_KEYS.filter((sourceKey) => sourceIsRegistered(html, sourceKey)).length;
  const missingFunctions = REQUIRED_FUNCTIONS.filter((name) => !hasFunction(html, name));
  const missingRuntimeMarkers = RUNTIME_MARKERS.filter((marker) => !html.includes(marker));
  const missingSourceConfiguration = ["var CONFIG", "var SOURCE_RUNTIME_CONFIG", "function applySourceRuntimeConfig"].filter(
    (marker) => !html.includes(marker)
  );
  const externalRuntimeReferences = findExternalRuntimeReferences(html);
  const passed =
    sourceCount === SOURCE_KEYS.length &&
    missingIds.length === 0 &&
    missingFunctions.length === 0 &&
    missingRuntimeMarkers.length === 0 &&
    missingSourceConfiguration.length === 0 &&
    externalRuntimeReferences.length === 0;

  outputAndExit({
    passed,
    sourceCount,
    missingIds,
    externalRuntimeReferences,
    ...(passed
      ? {}
      : { missingFunctions, missingRuntimeMarkers, missingSourceConfiguration })
  });
}
