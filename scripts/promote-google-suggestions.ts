import fs from "fs";
import path from "path";

const minScore = Number(process.argv[2] ?? process.env.GOOGLE_PROMOTE_MIN_SCORE ?? 0.95);
const input = path.resolve(process.cwd(), "data", "google-places-suggestions.csv");
const output = path.resolve(process.cwd(), "data", "google-places-curated.csv");

function parseCsvLine(line: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts;
}

const lines = fs.readFileSync(input, "utf-8").trim().split(/\r?\n/);
const rows: string[] = ["slug,googleBusinessId"];
let promoted = 0;

for (const line of lines.slice(1)) {
  if (!line.trim()) continue;
  const parts = parseCsvLine(line);
  const slug = parts[0]?.trim();
  const placeId = parts[4]?.trim();
  const score = Number(parts[7]);
  if (!slug || !placeId || !Number.isFinite(score) || score < minScore) continue;
  rows.push(`${slug},${placeId}`);
  promoted += 1;
}

fs.writeFileSync(output, rows.join("\n"), "utf-8");
console.log(`✓ ${promoted} filas (score >= ${minScore}) → ${output}`);
