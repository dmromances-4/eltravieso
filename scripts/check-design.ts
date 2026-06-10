#!/usr/bin/env tsx
/**
 * Fails CI if legacy brand hex/rgba slip into app/components.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "lib/theme"];

const FAIL_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: "legacy yellow #FFCC00", regex: /#FFCC00/i },
  { label: "legacy blue #00A3E0", regex: /#00A3E0/i },
  { label: "legacy red #EF2A2A", regex: /#EF2A2A/i },
  { label: "legacy rgba yellow", regex: /rgba\(255,\s*204,\s*0/i },
];

const WARN_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: "aggressive tracking (≥0.2em)", regex: /tracking-\[0\.[2-9]/ },
  { label: "shadow-neon", regex: /shadow-neon/ },
];

const EXT = new Set([".ts", ".tsx", ".css"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      walk(path, out);
    } else if (EXT.has(name.slice(name.lastIndexOf(".")))) {
      out.push(path);
    }
  }
  return out;
}

function scanFiles(files: string[], patterns: typeof FAIL_PATTERNS) {
  const hits: string[] = [];
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      for (const { label, regex } of patterns) {
        if (regex.test(lines[i]!)) {
          hits.push(`${relative(ROOT, file)}:${i + 1} [${label}] ${lines[i]!.trim()}`);
        }
      }
    }
  }
  return hits;
}

function main() {
  const files = SCAN_DIRS.flatMap((d) => {
    try {
      return walk(join(ROOT, d));
    } catch {
      return [];
    }
  });

  let failed = false;
  console.log(`check:design — scanning ${files.length} files`);

  const failHits = scanFiles(files, FAIL_PATTERNS);
  if (failHits.length) {
    failed = true;
    console.error("\n✗ Legacy design tokens found:");
    failHits.slice(0, 30).forEach((h) => console.error(`  ${h}`));
    if (failHits.length > 30) console.error(`  … and ${failHits.length - 30} more`);
  }

  const warnHits = scanFiles(files, WARN_PATTERNS);
  if (warnHits.length) {
    console.warn(`\n⚠ Review when touching (${warnHits.length} hits):`);
    warnHits.slice(0, 12).forEach((h) => console.warn(`  ${h}`));
  }

  if (failed) {
    console.error("\ncheck:design failed.");
    process.exit(1);
  }

  console.log("\ncheck:design passed.");
}

main();
