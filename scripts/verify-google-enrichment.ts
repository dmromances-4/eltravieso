import prisma from "../lib/prisma";

async function main() {
  const total = await prisma.venueGuideEntry.count({ where: { isPublished: true } });
  const withGoogle = await prisma.venueGuideEntry.count({
    where: { isPublished: true, googleBusinessId: { not: null } },
  });
  const enriched = await prisma.venueGuideEntry.count({
    where: { isPublished: true, enrichmentSource: "google_places" },
  });
  const withAddress = await prisma.venueGuideEntry.count({
    where: { isPublished: true, address: { not: null } },
  });
  const withWebsite = await prisma.venueGuideEntry.count({
    where: { isPublished: true, externalWebsite: { not: null } },
  });
  const withPrefs = await prisma.venueGuideEntry.count({
    where: { isPublished: true, NOT: { venuePreferences: { isEmpty: true } } },
  });

  console.log(
    JSON.stringify(
      {
        publishedVenues: total,
        withGoogleBusinessId: withGoogle,
        enrichmentSourceGoogle: enriched,
        withAddress,
        withExternalWebsite: withWebsite,
        withVenuePreferences: withPrefs,
        withoutGoogleId: total - withGoogle,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
