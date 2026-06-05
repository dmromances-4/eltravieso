/**
 * Backfill latitude/longitude for BarProfile rows via Nominatim.
 * Usage: tsx scripts/geocode-bars.ts
 */
import prisma from "../lib/prisma";
import { geocodeAddress } from "../lib/geocoding/nominatim";

async function main() {
  const bars = await prisma.barProfile.findMany({
    where: {
      OR: [{ latitude: null }, { longitude: null }],
    },
  });

  console.log(`Geocoding ${bars.length} bar(s)…`);

  for (const bar of bars) {
    const coords = await geocodeAddress({
      address: bar.address,
      city: bar.city,
      postalCode: bar.postalCode,
      province: bar.province ?? undefined,
      country: bar.country,
    });

    if (!coords) {
      console.warn(`  ✗ ${bar.businessName}: no result`);
      continue;
    }

    await prisma.barProfile.update({
      where: { id: bar.id },
      data: { latitude: coords.latitude, longitude: coords.longitude },
    });
    console.log(`  ✓ ${bar.businessName}: ${coords.latitude}, ${coords.longitude}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
