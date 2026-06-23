import fs from "fs";
import path from "path";
import prisma from "../lib/prisma";
import { requireDbPreflight } from "../lib/db-preflight";
import { validateGoogleBusinessId } from "../lib/venues/external-ids";
import {
  buildGoogleSearchQuery,
  buildGoogleVenueUpdate,
  fetchGooglePlaceDetails,
  googlePlacesRateMs,
  isGooglePlacesConfigured,
  normalizeGooglePlaceId,
  searchGooglePlaces,
  sleep,
} from "../lib/venues/enrich-google-places";
import { googlePlacesAutoMinScore, scorePlaceMatch } from "../lib/venues/google-place-match";

const SUGGESTIONS_OUT = path.resolve(process.cwd(), "data", "google-places-suggestions.csv");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const onlyMissing = args.includes("--only-missing");
const suggestMode = args.includes("--suggest");
const discoverMode = args.includes("--discover");
const autoMode = args.includes("--auto");
const importIdx = args.indexOf("--import");
const importPath = importIdx >= 0 ? args[importIdx + 1] : null;
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg
  ? Number(limitArg.split("=")[1])
  : Number(process.env.GOOGLE_ENRICH_LIMIT ?? 50);

const venueSelect = {
  id: true,
  slug: true,
  name: true,
  city: true,
  country: true,
  address: true,
  venueType: true,
  googleBusinessId: true,
  externalWebsite: true,
  latitude: true,
  longitude: true,
  geocodeConfidence: true,
  establishmentTypes: true,
  cuisineTypes: true,
  starDishes: true,
  idealFor: true,
  venueFeatures: true,
  awards: true,
  venuePreferences: true,
  neighborhood: true,
  priceRange: true,
} as const;

type VenueRow = {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string | null;
  address: string | null;
  venueType: string;
  googleBusinessId: string | null;
  externalWebsite: string | null;
  latitude: number | null;
  longitude: number | null;
  geocodeConfidence: string | null;
  establishmentTypes: string[];
  cuisineTypes: string[];
  starDishes: string[];
  idealFor: string[];
  venueFeatures: string[];
  awards: string[];
  venuePreferences: string[];
  neighborhood: string | null;
  priceRange: string | null;
};

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function resolveLimit(defaultValue: number): number {
  return Number.isFinite(limit) && limit > 0 ? limit : defaultValue;
}

async function enrichVenueFromGoogle(
  venue: VenueRow,
  placeId: string,
  options?: { assignPlaceId?: boolean },
): Promise<boolean> {
  const details = await fetchGooglePlaceDetails(placeId);
  await sleep(googlePlacesRateMs());

  if (!details) {
    console.warn(`  ✗ ${venue.slug}: sin respuesta de Places API`);
    return false;
  }

  const data = buildGoogleVenueUpdate(venue, details, options);

  if (dryRun) {
    console.log(`  ~ ${venue.slug}:`, data);
    return true;
  }

  await prisma.venueGuideEntry.update({
    where: { id: venue.id },
    data,
  });
  console.log(`  ✓ ${venue.slug}`);
  return true;
}

async function runSuggest() {
  const venues = await prisma.venueGuideEntry.findMany({
    where: {
      isPublished: true,
      OR: [{ googleBusinessId: null }, { googleBusinessId: "" }],
    },
    select: venueSelect,
    orderBy: { name: "asc" },
    take: resolveLimit(10_000),
  });

  console.log(`Generando sugerencias Google Places para ${venues.length} locales…`);
  const lines = [
    "slug,name,city,query,candidatePlaceId,candidateName,candidateAddress,matchScore,googleMapsUri",
  ];

  for (const venue of venues) {
    const query = buildGoogleSearchQuery({
      name: venue.name,
      city: venue.city,
      country: venue.country,
    });
    const candidate = await searchGooglePlaces(query, {
      latitude: venue.latitude,
      longitude: venue.longitude,
    });
    await sleep(googlePlacesRateMs());

    if (!candidate) {
      lines.push(
        [venue.slug, venue.name, venue.city, query, "", "", "", "0", ""].map(csvEscape).join(","),
      );
      continue;
    }

    const matchScore = scorePlaceMatch(venue, candidate).toFixed(3);
    lines.push(
      [
        venue.slug,
        venue.name,
        venue.city,
        query,
        candidate.placeId,
        candidate.displayName,
        candidate.formattedAddress,
        matchScore,
        candidate.googleMapsUri ?? "",
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  fs.mkdirSync(path.dirname(SUGGESTIONS_OUT), { recursive: true });
  fs.writeFileSync(SUGGESTIONS_OUT, lines.join("\n"), "utf-8");
  console.log(`✓ ${venues.length} filas en ${SUGGESTIONS_OUT}`);
}

type ImportRow = {
  slug: string;
  googleBusinessId: string;
};

function parseImportCsv(content: string): ImportRow[] {
  const lines = content.trim().split(/\r?\n/).slice(1);
  const rows: ImportRow[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
    if (parts.length < 2) continue;

    const slug = parts[0];
    const googleBusinessId =
      parts.length >= 6 ? parts[5] || parts[1] : parts[1] || parts[parts.length - 1];

    if (!slug || !googleBusinessId) continue;
    rows.push({ slug, googleBusinessId });
  }

  return rows;
}

async function runImport(csvPath: string) {
  const absolute = path.resolve(process.cwd(), csvPath);
  if (!fs.existsSync(absolute)) {
    console.error(`No existe el CSV: ${absolute}`);
    process.exit(1);
  }

  const rows = parseImportCsv(fs.readFileSync(absolute, "utf-8"));
  console.log(`Importando ${rows.length} filas desde ${absolute}…`);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const validated = validateGoogleBusinessId(normalizeGooglePlaceId(row.googleBusinessId));
    if (!validated.ok) {
      console.warn(`  ✗ ${row.slug}: ${validated.error}`);
      skipped += 1;
      continue;
    }

    const venue = await prisma.venueGuideEntry.findUnique({
      where: { slug: row.slug },
      select: venueSelect,
    });

    if (!venue) {
      console.warn(`  ✗ ${row.slug}: no encontrado en BD`);
      skipped += 1;
      continue;
    }

    const placeId = validated.value;
    const venueWithId: VenueRow = { ...venue, googleBusinessId: placeId };
    const ok = await enrichVenueFromGoogle(venueWithId, placeId, { assignPlaceId: true });
    if (ok) updated += 1;
    else skipped += 1;
  }

  console.log(`Listo: ${updated} importados, ${skipped} omitidos${dryRun ? " (dry-run)" : ""}.`);
}

async function runDiscoverAuto() {
  const minScore = googlePlacesAutoMinScore();
  const venues = await prisma.venueGuideEntry.findMany({
    where: {
      isPublished: true,
      OR: [{ googleBusinessId: null }, { googleBusinessId: "" }],
    },
    select: venueSelect,
    orderBy: { name: "asc" },
    take: resolveLimit(50),
  });

  console.log(
    `Descubrimiento auto (${venues.length} locales, umbral score >= ${minScore})…`,
  );

  let assigned = 0;
  let rejected = 0;
  let skipped = 0;

  for (const venue of venues) {
    const query = buildGoogleSearchQuery({
      name: venue.name,
      city: venue.city,
      country: venue.country,
    });
    const candidate = await searchGooglePlaces(query, {
      latitude: venue.latitude,
      longitude: venue.longitude,
    });
    await sleep(googlePlacesRateMs());

    if (!candidate) {
      console.warn(`  ✗ ${venue.slug}: sin candidato`);
      skipped += 1;
      continue;
    }

    const matchScore = scorePlaceMatch(venue, candidate);
    if (matchScore < minScore) {
      console.warn(
        `  ~ ${venue.slug}: rechazado (score ${matchScore.toFixed(3)} < ${minScore}) — ${candidate.displayName}`,
      );
      rejected += 1;
      continue;
    }

    const venueWithId: VenueRow = { ...venue, googleBusinessId: candidate.placeId };
    const ok = await enrichVenueFromGoogle(venueWithId, candidate.placeId, {
      assignPlaceId: true,
    });
    if (ok) assigned += 1;
    else skipped += 1;
  }

  console.log(
    `Listo: ${assigned} asignados, ${rejected} rechazados por score, ${skipped} omitidos${dryRun ? " (dry-run)" : ""}.`,
  );
}

async function runEnrich() {
  const venues = await prisma.venueGuideEntry.findMany({
    where: {
      isPublished: true,
      googleBusinessId: { not: null },
      ...(onlyMissing
        ? {
            OR: [
              { establishmentTypes: { isEmpty: true } },
              { venuePreferences: { isEmpty: true } },
              { neighborhood: null },
              { address: null },
              { externalWebsite: null },
              { latitude: null },
              { longitude: null },
            ],
          }
        : {}),
    },
    select: venueSelect,
    orderBy: { name: "asc" },
    take: resolveLimit(50),
  });

  console.log(`Enriqueciendo ${venues.length} locales desde Google Places…`);
  let updated = 0;
  let skipped = 0;

  for (const venue of venues) {
    const placeId = venue.googleBusinessId?.trim();
    if (!placeId) {
      skipped += 1;
      continue;
    }

    const ok = await enrichVenueFromGoogle(venue, placeId);
    if (ok) updated += 1;
    else skipped += 1;
  }

  console.log(`Listo: ${updated} procesados, ${skipped} omitidos${dryRun ? " (dry-run)" : ""}.`);
}

async function main() {
  if (!isGooglePlacesConfigured()) {
    console.error(
      "Falta GOOGLE_PLACES_API_KEY en .env.local. Activa Places API (New) en Google Cloud Console.",
    );
    console.error("No uses ADC/setup_adc.sh — este proyecto usa API key con X-Goog-Api-Key.");
    process.exit(1);
  }

  await requireDbPreflight("enrich:google");

  if (suggestMode) {
    await runSuggest();
    return;
  }

  if (importPath) {
    await runImport(importPath);
    return;
  }

  if (discoverMode && autoMode) {
    await runDiscoverAuto();
    return;
  }

  await runEnrich();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
