#!/usr/bin/env tsx
/**
 * Cobertura de campos editoriales en VenueGuideEntry.
 * npm run audit:venue-detail-coverage
 */

import prisma from "@/lib/prisma";

async function main() {
  const total = await prisma.venueGuideEntry.count({ where: { isPublished: true } });
  const withCoords = await prisma.venueGuideEntry.count({
    where: { isPublished: true, latitude: { not: null }, longitude: { not: null } },
  });
  const withPrefs = await prisma.venueGuideEntry.count({
    where: { isPublished: true, NOT: { venuePreferences: { equals: [] } } },
  });
  const withIdealFor = await prisma.venueGuideEntry.count({
    where: { isPublished: true, NOT: { idealFor: { equals: [] } } },
  });
  const withFeatures = await prisma.venueGuideEntry.count({
    where: { isPublished: true, NOT: { venueFeatures: { equals: [] } } },
  });

  const pct = (n: number) => (total ? ((n / total) * 100).toFixed(1) : "0");

  console.log(`Publicados: ${total}`);
  console.log(`Coordenadas: ${withCoords} (${pct(withCoords)}%)`);
  console.log(`venuePreferences: ${withPrefs} (${pct(withPrefs)}%)`);
  console.log(`idealFor: ${withIdealFor} (${pct(withIdealFor)}%)`);
  console.log(`venueFeatures: ${withFeatures} (${pct(withFeatures)}%)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
