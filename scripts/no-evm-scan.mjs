import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src", "templates"];
const blocked = [
  "Solidity",
  "Foundry",
  "Hardhat",
  "\\bforge\\b",
  "\\bcast\\b",
  "ERC-",
  "EVM",
  `${String.fromCharCode(48)}${String.fromCharCode(120)}`,
  "\\bgas\\b",
  "\\bgwei\\b",
  "\\bwei\\b",
  "eth_"
];

const allowed = new Map([
  ["src/mcp/nativeDevMcp.ts", ["mono://docs/no-evm"]],
  ["src/tests/devkit.test.ts", ["String.fromCharCode(48)"]]
]);

const files = [];

function walk(root) {
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      walk(path);
    } else if (/\.(ts|tsx|js|jsx|json|md|rs|toml)$/.test(path)) {
      files.push(path);
    }
  }
}

for (const root of roots) {
  walk(root);
}

const matcher = new RegExp(blocked.join("|"), "g");
const failures = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const matches = text.matchAll(matcher);
  const allowlist = allowed.get(file) ?? [];
  for (const match of matches) {
    const term = match[0];
    if (allowlist.some((entry) => text.includes(entry) && term.toLowerCase() === "evm")) {
      continue;
    }
    if (file === "src/tests/devkit.test.ts" && term === `${String.fromCharCode(48)}${String.fromCharCode(120)}`) {
      continue;
    }
    const line = text.slice(0, match.index).split("\n").length;
    failures.push(`${file}:${line}: ${term}`);
  }
}

if (failures.length > 0) {
  console.error("Native developer surface contains blocked terms:");
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }
  process.exit(1);
}

console.log("native developer guardrail scan passed");
