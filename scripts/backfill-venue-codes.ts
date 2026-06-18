import prisma from "../lib/prisma";
import { ensureUniqueVenueCode } from "../lib/venues/venue-code";

async function backfillGuideEntries() {
  const missing = await prisma.venueGuideEntry.findMany({
    where: { venueCode: null },
    select: { id: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  let updated = 0;
  for (const entry of missing) {
    const venueCode = await ensureUniqueVenueCode({ venueGuideEntryId: entry.id });
    await prisma.venueGuideEntry.update({
      where: { id: entry.id },
      data: { venueCode },
    });
    updated += 1;
    console.log(`  ${entry.slug} → ${venueCode}`);
  }
  return updated;
}

async function backfillBarProfiles() {
  const missing = await prisma.barProfile.findMany({
    where: { venueCode: null },
    select: { id: true, businessName: true, guideEntry: { select: { venueCode: true } } },
    orderBy: { createdAt: "asc" },
  });

  let updated = 0;
  for (const bar of missing) {
    const venueCode =
      bar.guideEntry?.venueCode ??
      (await ensureUniqueVenueCode({ barProfileId: bar.id }));
    await prisma.barProfile.update({
      where: { id: bar.id },
      data: { venueCode },
    });
    updated += 1;
    console.log(`  ${bar.businessName} → ${venueCode}`);
  }
  return updated;
}

async function main() {
  const guides = await backfillGuideEntries();
  const bars = await backfillBarProfiles();
  console.log(`✓ ${guides} guías + ${bars} bares con código ET-LOC-*****`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
