import prisma from "../lib/prisma";
import { geocodeVenue } from "../lib/geocoding/nominatim";

type VenueRow = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  city: string;
  country: string | null;
  geocodeConfidence: string | null;
};

const args = new Set(process.argv.slice(2));
const retryLowConfidence = args.has("--retry-low-confidence");

async function geocodeRow(venue: VenueRow) {
  return geocodeVenue({
    name: venue.name,
    address: venue.address,
    city: venue.city,
    country: venue.country,
  });
}

async function main() {
  const limit = process.env.GEOCODE_LIMIT ? Number(process.env.GEOCODE_LIMIT) : undefined;

  const targets = await prisma.venueGuideEntry.findMany({
    where: {
      isPublished: true,
      OR: retryLowConfidence
        ? [
            { latitude: null },
            { longitude: null },
            { geocodeConfidence: "low" },
            { geocodeConfidence: null },
          ]
        : [{ latitude: null }, { longitude: null }],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      address: true,
      city: true,
      country: true,
      geocodeConfidence: true,
    },
    orderBy: { slug: "asc" },
    ...(limit ? { take: limit } : {}),
  });

  console.log(`🌍 Geocodificando ${targets.length} locales…`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i += 1) {
    const venue = targets[i];
    const coords = await geocodeRow(venue);

    if (!coords) {
      failed += 1;
      console.warn(`  ✗ [${i + 1}/${targets.length}] ${venue.slug}`);
      continue;
    }

    await prisma.venueGuideEntry.update({
      where: { id: venue.id },
      data: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        geocodeConfidence: coords.confidence,
      },
    });
    updated += 1;
    console.log(`  ✓ [${i + 1}/${targets.length}] ${venue.slug} (${coords.confidence})`);
  }

  console.log(`✓ ${updated} geocodificados, ${failed} sin resultado`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
