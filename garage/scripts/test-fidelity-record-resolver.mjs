import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const targets = [
  {
    label: "Main File - Dark.html",
    url: new URL("../../Main File - Dark.html", import.meta.url),
  },
  {
    label: "Main File - Dark v2.html",
    url: new URL("../../Main File - Dark v2.html", import.meta.url),
  },
];

function extractFidelityConfig(html) {
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

function loadFidelity(fileUrl) {
  const html = fs.readFileSync(fileUrl, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(
    [
      "function trimValue(value) { return String(value == null ? '' : value).replace(/[\\u00A0\\u2007\\u202F\\u200B\\uFEFF]/g, ' ').replace(/^\\s+|\\s+$/g, ''); }",
      "function sliceValue(line, start, length) { return trimValue(String(line || '').substring(start - 1, start - 1 + length)); }",
      extractFidelityConfig(html),
    ].join("\n"),
    sandbox
  );
  return {
    fidelity: sandbox.window.FIDELITY_SOURCE_CONFIG,
    sliceValue: sandbox.sliceValue,
    trimValue: sandbox.trimValue,
  };
}

function put(chars, position, value) {
  String(value).split("").forEach((char, index) => {
    chars[position - 1 + index] = char;
  });
}

function fidelityLine(recordCode, payload, options = {}) {
  const chars = Array(120).fill(" ");
  put(chars, 30, recordCode);
  put(chars, options.payloadAt || 60, payload);
  if (options.extension) {
    put(chars, 32, options.extension);
  }
  return chars.join("");
}

for (const target of targets) {
  const { fidelity, sliceValue, trimValue } = loadFidelity(target.url);
  const resolve = (line) => fidelity.resolveRecord(line, sliceValue, trimValue);

  assert.equal(resolve(fidelityLine("02", "", { extension: "D" })), "02D", target.label);
  assert.equal(resolve(fidelityLine("02", "", { extension: "E" })), "02E", target.label);
  assert.equal(resolve(fidelityLine("07", "", { extension: "D" })), "07D", target.label);

  assert.equal(resolve(fidelityLine("77", "payload includes 02D")), "77", target.label);
  assert.equal(resolve(fidelityLine("18", "payload includes 02D")), "18", target.label);
  assert.equal(resolve(fidelityLine("15", "payload includes 02D")), "15", target.label);
  assert.equal(resolve(fidelityLine("77", "payload includes 02E")), "77", target.label);
  assert.equal(resolve(fidelityLine("18", "payload includes 02E")), "18", target.label);
  assert.equal(resolve(fidelityLine("77", "payload includes 07D")), "77", target.label);
}

console.log("Fidelity dark-file record resolver checks passed.");
