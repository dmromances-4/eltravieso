import fs from "fs";
import path from "path";
import prisma from "../lib/prisma";
import {
  parseTripadvisorPlaceIdFromUrl,
  tripadvisorUrlFromPlaceId,
  validateGoogleBusinessId,
  validateTripadvisorPlaceId,
} from "../lib/venues/external-ids";
import { mapTripAdvisorEnrichment } from "../lib/venues/enrich-taxonomy-mapper";
import { mergeDetailFieldArrays } from "../lib/venues/venue-profile-sync";
import { requireDbPreflight } from "../lib/db-preflight";

const SUGGESTIONS_OUT = path.resolve(process.cwd(), "data", "tripadvisor-suggestions.csv");

const args = process.argv.slice(2);
const suggestMode = args.includes("--suggest");
const importIdx = args.indexOf("--import");
const importPath = importIdx >= 0 ? args[importIdx + 1] : null;
const taxonomyOnly = args.includes("--taxonomy-only");
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
  features?: string[];
  awards?: string[];
};

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

function parseImportCsv(content: string): ImportRow[] {
  const lines = content.trim().split(/\r?\n/).slice(1);
  const rows: ImportRow[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = parseCsvLine(line).map((p) => p.trim().replace(/^"|"$/g, ""));
    if (parts.length < 2) continue;
    const [slug, tripadvisorUrl, ratingStr, address, tripadvisorPlaceId, googleBusinessId, priceLevelStr, cuisineLabelsStr, amenitiesStr, featuresStr, awardsStr] = parts;
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
      features: featuresStr
        ? featuresStr.split("|").map((s) => s.trim()).filter(Boolean)
        : undefined,
      awards: awardsStr
        ? awardsStr.split("|").map((s) => s.trim()).filter(Boolean)
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
      select: {
        address: true,
        googleBusinessId: true,
        tripadvisorPlaceId: true,
        establishmentTypes: true,
        cuisineTypes: true,
        starDishes: true,
        idealFor: true,
        venueFeatures: true,
        awards: true,
        venuePreferences: true,
        priceRange: true,
      },
    });
    if (!existing) continue;

    const hasTaxonomy =
      (row.cuisineLabels?.length ?? 0) > 0 ||
      (row.amenities?.length ?? 0) > 0 ||
      (row.features?.length ?? 0) > 0 ||
      (row.awards?.length ?? 0) > 0 ||
      row.priceLevel != null;

    const taFromUrl = row.tripadvisorUrl ? parseTripadvisorPlaceIdFromUrl(row.tripadvisorUrl) : null;
    const taValidated = validateTripadvisorPlaceId(row.tripadvisorPlaceId ?? taFromUrl ?? "");
    const gmbValidated = validateGoogleBusinessId(row.googleBusinessId ?? "");
    const resolvedPlaceId = taValidated.ok && taValidated.value ? taValidated.value : null;
    const resolvedTripadvisorUrl =
      row.tripadvisorUrl?.trim() ||
      (resolvedPlaceId ? tripadvisorUrlFromPlaceId(resolvedPlaceId) : "");

    if (!taxonomyOnly && !resolvedTripadvisorUrl && !hasTaxonomy) {
      console.warn(`  ✗ ${row.slug}: sin tripadvisorUrl/placeId ni taxonomía`);
      continue;
    }
    if (!taxonomyOnly && resolvedTripadvisorUrl && !resolvedPlaceId) {
      console.warn(`  ✗ ${row.slug}: ID TripAdvisor no válido en URL o columna tripadvisorPlaceId`);
      continue;
    }
    if (!taxonomyOnly && row.googleBusinessId?.trim() && !gmbValidated.ok) {
      console.warn(`  ✗ ${row.slug}: ${gmbValidated.error}`);
      continue;
    }
    if (taxonomyOnly && !hasTaxonomy) {
      console.warn(`  ✗ ${row.slug}: sin columnas de taxonomía`);
      continue;
    }

    const taxonomy = mapTripAdvisorEnrichment({
      priceLevel: row.priceLevel,
      cuisineLabels: row.cuisineLabels,
      amenities: row.amenities,
      features: row.features,
      awards: row.awards,
    });
    const merged = mergeDetailFieldArrays(existing, taxonomy);

    const result = await prisma.venueGuideEntry.updateMany({
      where: { slug: row.slug },
      data: {
        ...(resolvedTripadvisorUrl
          ? {
              tripadvisorUrl: resolvedTripadvisorUrl,
              tripadvisorRating: row.rating ?? null,
              tripadvisorPlaceId: resolvedPlaceId || existing.tripadvisorPlaceId || null,
            }
          : {}),
        googleBusinessId: gmbValidated.value || existing.googleBusinessId || null,
        address: existing.address ?? row.address ?? undefined,
        enrichmentSource: taxonomyOnly
          ? "tripadvisor_taxonomy"
          : resolvedTripadvisorUrl
            ? "tripadvisor"
            : "tripadvisor_preferences",
        establishmentTypes: merged.establishmentTypes,
        cuisineTypes: merged.cuisineTypes,
        starDishes: merged.starDishes,
        idealFor: merged.idealFor,
        venueFeatures: merged.venueFeatures,
        awards: merged.awards,
        venuePreferences: merged.venuePreferences,
        priceRange: existing.priceRange ?? taxonomy.priceRange ?? undefined,
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
  await requireDbPreflight("enrich:tripadvisor");

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
  npx tsx scripts/enrich-venues-tripadvisor.ts --import data/tripadvisor-curated.csv --taxonomy-only

CSV import (columnas):
  slug,tripadvisorUrl,rating,address,tripadvisorPlaceId,googleBusinessId,priceLevel,cuisineLabels,amenities,features,awards
  rating, address, IDs, priceLevel, cuisineLabels, amenities, features y awards (pipe-separated) son opcionales`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
