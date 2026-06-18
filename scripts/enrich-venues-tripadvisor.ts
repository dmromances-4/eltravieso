import fs from "fs";
import path from "path";
import prisma from "../lib/prisma";
import {
  parseTripadvisorPlaceIdFromUrl,
  validateGoogleBusinessId,
  validateTripadvisorPlaceId,
} from "../lib/venues/external-ids";
import { mapTripAdvisorEnrichment } from "../lib/venues/enrich-taxonomy-mapper";

const SUGGESTIONS_OUT = path.resolve(process.cwd(), "data", "tripadvisor-suggestions.csv");

const args = process.argv.slice(2);
const suggestMode = args.includes("--suggest");
const importIdx = args.indexOf("--import");
const importPath = importIdx >= 0 ? args[importIdx + 1] : null;
const usePlaywright = process.env.TRIPADVISOR_PLAYWRIGHT === "true";

function needsEnrichment(venue: {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  history: string | null;
  tripadvisorUrl: string | null;
}): boolean {
  if (venue.tripadvisorUrl) return false;
  return !venue.address || venue.latitude == null || venue.longitude == null || !venue.history;
}

function searchUrl(name: string, city: string): string {
  const q = encodeURIComponent(`${name} ${city}`);
  return `https://www.tripadvisor.es/Search?q=${q}`;
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function runSuggest() {
  const venues = await prisma.venueGuideEntry.findMany({
    where: { isPublished: true },
    select: {
      slug: true,
      name: true,
      city: true,
      address: true,
      latitude: true,
      longitude: true,
      history: true,
      tripadvisorUrl: true,
    },
    orderBy: { name: "asc" },
  });

  const rows = venues.filter(needsEnrichment);
  const lines = ["slug,name,city,searchUrl"];
  for (const v of rows) {
    lines.push(
      [v.slug, v.name, v.city, searchUrl(v.name, v.city)].map(csvEscape).join(","),
    );
  }

  fs.mkdirSync(path.dirname(SUGGESTIONS_OUT), { recursive: true });
  fs.writeFileSync(SUGGESTIONS_OUT, lines.join("\n"), "utf-8");
  console.log(`✓ ${rows.length} sugerencias en ${SUGGESTIONS_OUT}`);
}

type ImportRow = {
  slug: string;
  tripadvisorUrl: string;
  rating?: number;
  address?: string;
  tripadvisorPlaceId?: string;
  googleBusinessId?: string;
  priceLevel?: number;
  cuisineLabels?: string[];
  amenities?: string[];
};

function parseImportCsv(content: string): ImportRow[] {
  const lines = content.trim().split(/\r?\n/).slice(1);
  const rows: ImportRow[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
    if (parts.length < 2) continue;
    const [slug, tripadvisorUrl, ratingStr, address, tripadvisorPlaceId, googleBusinessId, priceLevelStr, cuisineLabelsStr, amenitiesStr] = parts;
    const rating = ratingStr ? Number(ratingStr) : undefined;
    const priceLevel = priceLevelStr ? Number(priceLevelStr) : undefined;
    rows.push({
      slug,
      tripadvisorUrl,
      rating: Number.isFinite(rating) ? rating : undefined,
      address: address || undefined,
      tripadvisorPlaceId: tripadvisorPlaceId || undefined,
      googleBusinessId: googleBusinessId || undefined,
      priceLevel: Number.isFinite(priceLevel) ? priceLevel : undefined,
      cuisineLabels: cuisineLabelsStr
        ? cuisineLabelsStr.split("|").map((s) => s.trim()).filter(Boolean)
        : undefined,
      amenities: amenitiesStr
        ? amenitiesStr.split("|").map((s) => s.trim()).filter(Boolean)
        : undefined,
    });
  }

  return rows;
}

async function runImport(file: string) {
  if (!fs.existsSync(file)) {
    console.error(`No existe ${file}`);
    process.exit(1);
  }

  const rows = parseImportCsv(fs.readFileSync(file, "utf-8"));
  let updated = 0;

  for (const row of rows) {
    const existing = await prisma.venueGuideEntry.findFirst({
      where: { slug: row.slug },
      select: { address: true, googleBusinessId: true, tripadvisorPlaceId: true },
    });
    if (!existing) continue;

    const taFromUrl = parseTripadvisorPlaceIdFromUrl(row.tripadvisorUrl);
    const taValidated = validateTripadvisorPlaceId(row.tripadvisorPlaceId ?? taFromUrl ?? "");
    const gmbValidated = validateGoogleBusinessId(row.googleBusinessId ?? "");
    if (!taValidated.ok) {
      console.warn(`  ✗ ${row.slug}: ${taValidated.error}`);
      continue;
    }
    if (!gmbValidated.ok) {
      console.warn(`  ✗ ${row.slug}: ${gmbValidated.error}`);
      continue;
    }

    const taxonomy = mapTripAdvisorEnrichment({
      priceLevel: row.priceLevel,
      cuisineLabels: row.cuisineLabels,
      amenities: row.amenities,
    });

    const result = await prisma.venueGuideEntry.updateMany({
      where: { slug: row.slug },
      data: {
        tripadvisorUrl: row.tripadvisorUrl,
        tripadvisorRating: row.rating ?? null,
        tripadvisorPlaceId: taValidated.value || existing.tripadvisorPlaceId || null,
        googleBusinessId: gmbValidated.value || existing.googleBusinessId || null,
        address: existing.address ?? row.address ?? undefined,
        enrichmentSource: "tripadvisor",
        ...taxonomy,
      },
    });
    if (result.count) updated += 1;
  }

  console.log(`✓ ${updated} locales actualizados desde ${file}`);
}

async function runPlaywrightSuggest() {
  console.warn("TRIPADVISOR_PLAYWRIGHT: no implementado (sin dependencia playwright).");
  console.warn("Usa --suggest + --import con CSV curado.");
}

async function main() {
  if (importPath) {
    await runImport(importPath);
    return;
  }

  if (suggestMode) {
    if (usePlaywright) {
      await runPlaywrightSuggest();
    }
    await runSuggest();
    return;
  }

  console.log(`Uso:
  npx tsx scripts/enrich-venues-tripadvisor.ts --suggest
  npx tsx scripts/enrich-venues-tripadvisor.ts --import data/tripadvisor-curated.csv

CSV import (columnas):
  slug,tripadvisorUrl,rating,address,tripadvisorPlaceId,googleBusinessId,priceLevel,cuisineLabels,amenities
  rating, address, IDs, priceLevel, cuisineLabels (pipe-separated) y amenities son opcionales`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
