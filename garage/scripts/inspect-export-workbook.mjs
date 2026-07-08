import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = process.argv[2];
const outputDir = process.argv[3] || path.resolve("garage", "outputs", "export-inspection");

if (!inputPath) {
  throw new Error("Usage: node inspect-export-workbook.mjs <input.xlsx> [outputDir]");
}

await fs.mkdir(outputDir, { recursive: true });

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const sheetOverview = await workbook.inspect({
  kind: "workbook,sheet,table,drawing,definedName",
  maxChars: 20000,
  tableMaxRows: 8,
  tableMaxCols: 8,
  tableMaxCellChars: 80,
});

const sheetListText = await workbook.inspect({
  kind: "sheet",
  include: "id,name",
  maxChars: 10000,
});

const sheetRecords = sheetListText.ndjson
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line))
  .filter((record) => record.name);

const sheetSummaries = [];

for (const sheet of sheetRecords) {
  const name = sheet.name;
  const safeName = name.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").slice(0, 80);
  const table = await workbook.inspect({
    kind: "region,table,formula,computedStyle,drawing",
    sheetId: name,
    range: "A1:Z35",
    maxChars: 25000,
    tableMaxRows: 20,
    tableMaxCols: 18,
    tableMaxCellChars: 100,
  });

  const errorMatches = await workbook.inspect({
    kind: "match",
    sheetId: name,
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 100 },
    summary: `formula errors on ${name}`,
    maxChars: 8000,
  });

  const preview = await workbook.render({
    sheetName: name,
    autoCrop: "all",
    scale: 1,
    format: "png",
  });

  const previewPath = path.join(outputDir, `${safeName || "sheet"}-preview.png`);
  await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));

  sheetSummaries.push({
    name,
    previewPath,
    firstRegion: table.ndjson,
    formulaErrors: errorMatches.ndjson,
  });
}

const out = {
  inputPath,
  outputDir,
  overview: sheetOverview.ndjson,
  sheets: sheetSummaries,
};

await fs.writeFile(path.join(outputDir, "inspection.json"), JSON.stringify(out, null, 2), "utf8");

console.log(JSON.stringify({
  inputPath,
  outputDir,
  sheetCount: sheetSummaries.length,
  sheets: sheetSummaries.map(({ name, previewPath }) => ({ name, previewPath })),
}, null, 2));
