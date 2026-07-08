import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const htmlFileName = process.env.PICKER_CONTRACT_HTML || "Main File.html";
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

const checks = [
  {
    name: "main source input is a file picker that supports multi-file vendor selections",
    pass: html.includes('id="fileInput"') &&
      /<input id="fileInput"[^>]*type="file"[^>]*multiple/.test(html)
  },
  {
    name: "folder picker UI has been removed",
    pass: !html.includes('id="folderInput"') &&
      !html.includes('id="folderInputBlock"') &&
      !html.includes("webkitdirectory") &&
      !html.includes("Choose Folder") &&
      !html.includes("Select Source Folder")
  },
  {
    name: "source card and picker copy describe file picker mode",
    pass: html.includes("File picker") &&
      html.includes("file picker mode") &&
      !html.includes("Folder input") &&
      !html.includes("folder mode")
  },
  {
    name: "multi-file vendors route through selected-file parser",
    pass: html.includes("function usesSelectedFileSet") &&
      html.includes("function parseSelectedFilesPayload") &&
      html.includes("usesSelectedFileSet(source)") &&
      html.includes("source.customFolderParser(source, files, thisRunId)")
  }
];

const failures = checks.filter((check) => !check.pass);
if (failures.length) {
  console.error("Vendor file picker contract checks failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log(`Passed ${checks.length} vendor file picker contract checks for ${htmlFileName}.`);
