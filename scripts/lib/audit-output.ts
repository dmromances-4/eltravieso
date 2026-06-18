import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

export function writeAuditReport(filename: string, payload: unknown): string {
  const dir = resolve(process.cwd(), "data/audits");
  mkdirSync(dir, { recursive: true });
  const outPath = resolve(dir, filename);
  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return outPath;
}

export function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
