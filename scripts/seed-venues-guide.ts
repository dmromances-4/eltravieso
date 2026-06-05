import fs from "fs";
import path from "path";
import type { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { geocodeAddress } from "../lib/geocoding/nominatim";
import { mergeVenueGuides } from "../lib/venues/merge-guide";
import { normalizeVenueKey } from "../lib/venues/unique-slug";
import type { NormalizedVenueGuide } from "../lib/venues/types";

const DATA_FILE = path.resolve(process.cwd(), "data", "venues-worlds50best.json");
const GEOCODE = process.env.SEED_VENUES_GEOCODE === "true";

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function venueToDbFields(venue: NormalizedVenueGuide, latitude: number | null, longitude: number | null) {
  return {
    slug: venue.slug,
    name: venue.name,
    city: venue.city,
    country: venue.country ?? null,
    address: venue.address ?? null,
    venueType: venue.venueType,
    photoUrl: venue.photoUrl ?? null,
    history: venue.history ?? null,
    verdict: venue.verdict ?? null,
    chefName: venue.chefName ?? null,
    worlds50bestRank: venue.worlds50bestRank,
    worlds50bestCategory: venue.worlds50bestCategory,
    continent: venue.continent ?? null,
    listScope: venue.listScope ?? "GLOBAL",
    regionalRank: venue.regionalRank ?? null,
    additionalRankings: (venue.additionalRankings ?? []) as Prisma.InputJsonValue,
    sourceUrl: venue.sourceUrl,
    externalWebsite: venue.externalWebsite ?? null,
    tripadvisorUrl: venue.tripadvisorUrl ?? null,
    tripadvisorRating: venue.tripadvisorRating ?? null,
    enrichmentSource: venue.enrichmentSource ?? "worlds50best",
    latitude,
    longitude,
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

async function main() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`No existe ${DATA_FILE}. Ejecuta: npm run scrape:venues`);
    process.exit(1);
  }

  const venues = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as NormalizedVenueGuide[];
  console.log(`📥 Importando ${venues.length} locales editoriales…`);

  let upserted = 0;
  let linked = 0;
  let geocoded = 0;

  for (const venue of venues) {
    let latitude = venue.latitude ?? null;
    let longitude = venue.longitude ?? null;

    if (GEOCODE && (latitude == null || longitude == null) && venue.address) {
      const coords = await geocodeAddress({
        address: venue.address,
        city: venue.city,
        country: venue.country ?? undefined,
      });
      if (coords) {
        latitude = coords.latitude;
        longitude = coords.longitude;
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

    const existing = await prisma.venueGuideEntry.findUnique({
      where: { sourceUrl: venue.sourceUrl },
    });

    let mergedVenue = venue;
    if (existing) {
      const existingNormalized: NormalizedVenueGuide = {
        slug: existing.slug,
        name: existing.name,
        city: existing.city,
        country: existing.country,
        address: existing.address,
        venueType: existing.venueType,
        photoUrl: existing.photoUrl,
        history: existing.history,
        verdict: existing.verdict,
        chefName: existing.chefName,
        worlds50bestRank: existing.worlds50bestRank,
        worlds50bestCategory: existing.worlds50bestCategory,
        continent: existing.continent ?? undefined,
        listScope: existing.listScope,
        regionalRank: existing.regionalRank,
        additionalRankings: Array.isArray(existing.additionalRankings)
          ? (existing.additionalRankings as NormalizedVenueGuide["additionalRankings"])
          : [],
        sourceUrl: existing.sourceUrl,
        externalWebsite: existing.externalWebsite,
        tripadvisorUrl: existing.tripadvisorUrl,
        tripadvisorRating: existing.tripadvisorRating,
        enrichmentSource: existing.enrichmentSource,
        latitude: existing.latitude,
        longitude: existing.longitude,
      };
      mergedVenue = mergeVenueGuides(existingNormalized, venue);
      if (latitude == null && existing.latitude != null) latitude = existing.latitude;
      if (longitude == null && existing.longitude != null) longitude = existing.longitude;
      if (!mergedVenue.tripadvisorUrl && existing.tripadvisorUrl) {
        mergedVenue.tripadvisorUrl = existing.tripadvisorUrl;
      }
      if (mergedVenue.tripadvisorRating == null && existing.tripadvisorRating != null) {
        mergedVenue.tripadvisorRating = existing.tripadvisorRating;
      }
    }

    const data = venueToDbFields(mergedVenue, latitude, longitude);

    await prisma.venueGuideEntry.upsert({
      where: { sourceUrl: venue.sourceUrl },
      create: { ...data, barProfileId: matched?.id ?? null },
      update: { ...data, barProfileId: matched?.id ?? null },
    });
    upserted += 1;
  }

  console.log(`✓ ${upserted} upserts, ${linked} vinculados a BarProfile, ${geocoded} geocodificados`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
