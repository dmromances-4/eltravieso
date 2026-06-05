import prisma from "../lib/prisma";
import { geocodeAddress, type GeocodeResult } from "../lib/geocoding/nominatim";

type VenueRow = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  city: string;
  country: string | null;
};

async function geocodeVenue(venue: VenueRow): Promise<GeocodeResult | null> {
  const base = { city: venue.city, country: venue.country ?? undefined, defaultCountry: null };

  const strategies: { address: string }[] = [];
  if (venue.address) strategies.push({ address: venue.address });
  strategies.push({ address: venue.name });
  if (venue.city) strategies.push({ address: `${venue.name}, ${venue.city}` });

  for (const { address } of strategies) {
    const coords = await geocodeAddress({ ...base, address });
    if (coords) return coords;
  }

  return null;
}

async function main() {
  const limit = process.env.GEOCODE_LIMIT ? Number(process.env.GEOCODE_LIMIT) : undefined;

  const missing = await prisma.venueGuideEntry.findMany({
    where: {
      isPublished: true,
      OR: [{ latitude: null }, { longitude: null }],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      address: true,
      city: true,
      country: true,
    },
    orderBy: { slug: "asc" },
    ...(limit ? { take: limit } : {}),
  });

  console.log(`🌍 Geocodificando ${missing.length} locales sin coordenadas…`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < missing.length; i += 1) {
    const venue = missing[i];
    const coords = await geocodeVenue(venue);

    if (!coords) {
      failed += 1;
      console.warn(`  ✗ [${i + 1}/${missing.length}] ${venue.slug}`);
      continue;
    }

    await prisma.venueGuideEntry.update({
      where: { id: venue.id },
      data: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
    });
    updated += 1;
    console.log(`  ✓ [${i + 1}/${missing.length}] ${venue.slug}`);
  }

  console.log(`✓ ${updated} geocodificados, ${failed} sin resultado`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
