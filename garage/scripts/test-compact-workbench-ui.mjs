import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const defaultTarget = "Workbook Console - Compact Workbench.html";
const requestedTarget = process.argv[2] || defaultTarget;
const htmlPath = path.resolve(root, requestedTarget);

function fail(message) {
  console.error(`Compact Workbench UI contract failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(htmlPath)) {
  fail(`target HTML does not exist: ${htmlPath}`);
}

let html;
try {
  html = fs.readFileSync(htmlPath, "utf8");
} catch (error) {
  fail(`could not read target HTML: ${error.message}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasElementWithId(id) {
  const idPattern = escapeRegExp(id);
  return new RegExp(`<[^>]+\\bid=["']${idPattern}["'][^>]*>`, "i").test(html);
}

function extractStyleBlocks() {
  return Array.from(html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi), (match) => match[1]);
}

function hasResponsiveBreakpoint(maxWidth) {
  const units = maxWidth === 1023 ? "1023px" : "(?:759|760)px";
  return new RegExp(`@media\\s*\\(\\s*max-width\\s*:\\s*${units}\\s*\\)`, "i").test(html);
}

function pageRootEnablesHorizontalScrolling(css) {
  const rootSelector = "(?:html|body|html\\.compact-workbench|body\\.compact-workbench)";
  const rootRule = new RegExp(`(?:^|,|})\\s*${rootSelector}\\s*(?:,|\\{)([^}]*)\\}`, "gi");
  let match;
  while ((match = rootRule.exec(css))) {
    if (/overflow-x\s*:\s*(?:auto|scroll)/i.test(match[1])) return true;
  }
  return false;
}

const styles = extractStyleBlocks();
const allCss = styles.join("\n");
const detailControls = Array.from(
  html.matchAll(/<button\b(?=[^>]*\baria-expanded=["'][^"']+["'])(?=[^>]*\baria-controls=["'][^"']+["'])[^>]*>/gi)
);
const missingDetailTargets = detailControls
  .map((match) => match[0].match(/\baria-controls=["']([^"']+)["']/i)?.[1])
  .filter(Boolean)
  .filter((id) => !hasElementWithId(id));
const disclosureFactoryStart = html.search(/function\s+makeDisclosure\s*\(/i);
const disclosureFactoryEnd = disclosureFactoryStart >= 0 ? html.indexOf("var reviewSection", disclosureFactoryStart) : -1;
const disclosureFactory = disclosureFactoryStart >= 0 && disclosureFactoryEnd > disclosureFactoryStart
  ? html.slice(disclosureFactoryStart, disclosureFactoryEnd)
  : "";
const runtimeDisclosureIds = ["cw-discard-detail", "cw-source-detail", "cw-fund-detail"];
const runtimeDisclosureContract =
  /createNode\(\s*["']button["']/i.test(disclosureFactory) &&
  /setAttribute\(\s*["']aria-expanded["']/i.test(disclosureFactory) &&
  /setAttribute\(\s*["']aria-controls["']\s*,\s*regionId\s*\)/i.test(disclosureFactory) &&
  /region\.id\s*=\s*regionId/i.test(disclosureFactory) &&
  runtimeDisclosureIds.every((id) => html.includes(`makeDisclosure(`) && html.includes(`"${id}"`));

const checks = [
  {
    name: "scoped Compact Workbench skin marker",
    pass: /<style\b[^>]*\bid=["']compact-workbench-skin["'][^>]*>/i.test(html) &&
      /(?:body|html)\.compact-workbench|\.compact-workbench\b/i.test(allCss),
  },
  {
    name: "Compact Workbench layout adapter marker",
    pass: /<script\b[^>]*\bid=["']compact-workbench-layout-adapter["'][^>]*>/i.test(html) &&
      /classList\.add\(\s*["']compact-workbench["']\s*\)/i.test(html),
  },
  {
    name: "Configure navigation label",
    pass: />\s*Configure\s*</i.test(html),
  },
  {
    name: "Review navigation label",
    pass: />\s*Review\s*</i.test(html),
  },
  {
    name: "Export navigation label",
    pass: />\s*Export\s*</i.test(html),
  },
  {
    name: "Reports navigation label",
    pass: />\s*Reports\s*</i.test(html),
  },
  {
    name: "keyboard-operable detail controls with linked regions",
    pass: (detailControls.length >= 3 && missingDetailTargets.length === 0) || runtimeDisclosureContract,
  },
  {
    name: "reduced-motion override",
    pass: /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i.test(allCss) &&
      /transition-duration\s*:\s*(?:0|0ms|0s)\b|animation(?:-duration)?\s*:\s*(?:none|0(?:ms|s)?)/i.test(allCss),
  },
  {
    name: "1023px rail-collapse breakpoint",
    pass: hasResponsiveBreakpoint(1023),
  },
  {
    name: "sub-760px compact navigation breakpoint",
    pass: hasResponsiveBreakpoint(760),
  },
  {
    name: "page roots do not enable horizontal scrolling",
    pass: !pageRootEnablesHorizontalScrolling(allCss) &&
      !/(?:document\.documentElement|document\.body)\.style\.overflowX\s*=\s*["'](?:auto|scroll)["']/i.test(html),
  },
  {
    name: "legacy responsive rules cannot stack desktop section headers",
    pass: /body\.compact-workbench\s+\.step-block-head\s*\{(?=[^}]*display\s*:\s*flex\s*!important)(?=[^}]*flex-direction\s*:\s*row\s*!important)[^}]*\}/i.test(allCss),
  },
  {
    name: "parse metrics reset legacy dark pill surfaces",
    pass: /body\.compact-workbench\s+\.kpi-parse-metrics\s+\.parse-metric\s*\{[^}]*background\s*:\s*var\(--cw-surface\)\s*!important[^}]*border-radius\s*:\s*0\s*!important/is.test(allCss),
  },
];

const failures = checks.filter((check) => !check.pass);
if (failures.length) {
  console.error(`Compact Workbench UI contract checks failed for ${requestedTarget}:`);
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log(`Passed ${checks.length} Compact Workbench UI contract checks for ${requestedTarget}.`);
