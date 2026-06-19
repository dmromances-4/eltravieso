import fs from "fs";
import path from "path";
import prisma from "../lib/prisma";
import { geocodeVenue } from "../lib/geocoding/nominatim";
import { mergeVenueGuides } from "../lib/venues/merge-guide";
import { venueGuideEntryToNormalized } from "../lib/venues/guide-from-db";
import { venueGuideToDbFields } from "../lib/venues/guide-to-db";
import { ensureUniqueVenueCode } from "../lib/venues/venue-code";
import { normalizeVenueKey } from "../lib/venues/unique-slug";
import type { NormalizedVenueGuide } from "../lib/venues/types";
import type { SyncPhaseResult } from "../lib/catalog/sync-report";
import { pathToFileURL } from "url";

export const VENUES_DATA_FILE = path.resolve(process.cwd(), "data", "venues-worlds50best.json");
const DATA_FILE = VENUES_DATA_FILE;
const GEOCODE = process.env.SEED_VENUES_GEOCODE === "true";

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function venueToDbFields(
  venue: NormalizedVenueGuide,
  latitude: number | null,
  longitude: number | null,
  geocodeConfidence: string | null,
) {
  return {
    ...venueGuideToDbFields(venue, { latitude, longitude, geocodeConfidence }),
    scrapedAt: new Date(),
  };
}

async function matchBarProfile(venue: NormalizedVenueGuide) {
  const key = normalizeVenueKey(venue.name, venue.city);
  const bars = await prisma.barProfile.findMany({
    select: { id: true, businessName: true, city: true, history: true, photoUrl: true },
  });

  for (const bar of bars) {
    const barKey = normalizeVenueKey(bar.businessName, bar.city);
    if (barKey === key) return bar;
    if (
      normalizeName(bar.businessName) === normalizeName(venue.name) &&
      normalizeName(bar.city) === normalizeName(venue.city)
    ) {
      return bar;
    }
  }
  return null;
}

export type SeedVenuesOptions = {
  geocode?: boolean;
  dataFile?: string;
};

export async function seedVenuesGuide(options: SeedVenuesOptions = {}): Promise<SyncPhaseResult> {
  const dataFile = options.dataFile ?? DATA_FILE;
  const geocode = options.geocode ?? GEOCODE;

  if (!fs.existsSync(dataFile)) {
    console.error(`No existe ${dataFile}. Ejecuta: npm run scrape:venues`);
    return { added: 0, skipped: 0, total: 0, errors: 1 };
  }

  const venues = JSON.parse(fs.readFileSync(dataFile, "utf-8")) as NormalizedVenueGuide[];
  console.log(`📥 Importando ${venues.length} locales editoriales…`);

  let upserted = 0;
  let linked = 0;
  let geocoded = 0;
  let skipped = 0;
  let created = 0;

  for (const venue of venues) {
    let latitude = venue.latitude ?? null;
    let longitude = venue.longitude ?? null;
    let geocodeConfidence: string | null = null;

    const existing = await prisma.venueGuideEntry.findUnique({
      where: { sourceUrl: venue.sourceUrl },
    });

    if (existing) {
      if (latitude == null) latitude = existing.latitude;
      if (longitude == null) longitude = existing.longitude;
      geocodeConfidence = existing.geocodeConfidence;
    }

    if (geocode && (latitude == null || longitude == null)) {
      const coords = await geocodeVenue({
        name: venue.name,
        address: venue.address,
        city: venue.city,
        country: venue.country,
      });
      if (coords) {
        latitude = coords.latitude;
        longitude = coords.longitude;
        geocodeConfidence = coords.confidence;
        geocoded += 1;
      }
    }

    const matched = await matchBarProfile(venue);
    if (matched) {
      linked += 1;
      const updates: Record<string, unknown> = {};
      if (!matched.history && venue.history) updates.history = venue.history;
      if (!matched.photoUrl && venue.photoUrl) updates.photoUrl = venue.photoUrl;
      if (Object.keys(updates).length) {
        await prisma.barProfile.update({ where: { id: matched.id }, data: updates });
      }
    }

    let mergedVenue = venue;
    if (existing) {
      const existingNormalized = venueGuideEntryToNormalized(existing);
      mergedVenue = mergeVenueGuides(existingNormalized, venue);
    }

    if (!mergedVenue.venueCode) {
      mergedVenue.venueCode = await ensureUniqueVenueCode(
        existing?.id ? { venueGuideEntryId: existing.id } : undefined,
      );
    }

    const data = venueToDbFields(mergedVenue, latitude, longitude, geocodeConfidence);

    try {
      await prisma.venueGuideEntry.upsert({
        where: { sourceUrl: venue.sourceUrl },
        create: { ...data, barProfileId: matched?.id ?? null },
        update: { ...data, barProfileId: matched?.id ?? null },
      });
      upserted += 1;
      if (!existing) created += 1;
    } catch (err) {
      console.warn(`  omitido ${venue.slug}:`, (err as Error).message.slice(0, 120));
      skipped += 1;
    }
  }

  console.log(
    `✓ ${upserted} upserts, ${linked} vinculados a BarProfile, ${geocoded} geocodificados` +
      (skipped ? `, ${skipped} omitidos (encoding u otro error)` : ""),
  );

  return {
    added: created,
    skipped: upserted - created + skipped,
    total: venues.length,
    errors: skipped,
  };
}

async function main() {
  const result = await seedVenuesGuide();
  if (result.errors > 0 && result.total === 0) process.exit(1);
}

const isDirectRun = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isDirectRun) {
  main()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
