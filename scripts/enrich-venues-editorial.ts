import prisma from "../lib/prisma";
import { requireDbPreflight } from "../lib/db-preflight";
import { mapEditorialHeuristics } from "../lib/venues/enrich-editorial-heuristics";
import { mergeDetailFieldArrays } from "../lib/venues/venue-profile-sync";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const onlyMissing = args.includes("--only-missing");
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;

async function main() {
  await requireDbPreflight("enrich:editorial");

  const venues = await prisma.venueGuideEntry.findMany({
    where: {
      isPublished: true,
      OR: [
        { cuisineTypes: { isEmpty: true } },
        { idealFor: { isEmpty: true } },
        { venueFeatures: { isEmpty: true } },
        { starDishes: { isEmpty: true } },
        ...(onlyMissing ? [{ venuePreferences: { isEmpty: true } }] : []),
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      history: true,
      verdict: true,
      chefName: true,
      establishmentTypes: true,
      cuisineTypes: true,
      starDishes: true,
      idealFor: true,
      venueFeatures: true,
      awards: true,
      venuePreferences: true,
    },
    orderBy: { worlds50bestRank: "asc" },
    take: Number.isFinite(limit) && limit! > 0 ? limit : undefined,
  });

  console.log(`Enriqueciendo ${venues.length} locales desde texto editorial…`);
  let updated = 0;

  for (const venue of venues) {
    const inferred = mapEditorialHeuristics({
      name: venue.name,
      history: venue.history,
      verdict: venue.verdict,
      chefName: venue.chefName,
    });

    const merged = mergeDetailFieldArrays(venue, inferred);
    const hasChanges =
      merged.cuisineTypes.length > venue.cuisineTypes.length ||
      merged.idealFor.length > venue.idealFor.length ||
      merged.venueFeatures.length > venue.venueFeatures.length ||
      merged.starDishes.length > venue.starDishes.length ||
      merged.awards.length > venue.awards.length;

    if (!hasChanges) continue;

    if (dryRun) {
      console.log(`  ~ ${venue.slug}:`, {
        cuisineTypes: merged.cuisineTypes,
        idealFor: merged.idealFor,
        venueFeatures: merged.venueFeatures,
        starDishes: merged.starDishes,
        awards: merged.awards,
      });
      updated += 1;
      continue;
    }

    await prisma.venueGuideEntry.update({
      where: { id: venue.id },
      data: {
        cuisineTypes: merged.cuisineTypes,
        idealFor: merged.idealFor,
        venueFeatures: merged.venueFeatures,
        starDishes: merged.starDishes,
        awards: merged.awards,
        enrichmentSource: venue.cuisineTypes.length ? undefined : "editorial_heuristics",
      },
    });
    console.log(`  ✓ ${venue.slug}`);
    updated += 1;
  }

  console.log(`Listo: ${updated} locales${dryRun ? " (dry-run)" : ""}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
