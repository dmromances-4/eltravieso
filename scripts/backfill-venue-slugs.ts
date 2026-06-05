import prisma from "../lib/prisma";
import { generateUniqueBarSlug } from "../lib/venues/unique-slug";

async function main() {
  const profiles = await prisma.barProfile.findMany({
    where: { slug: null },
    select: { id: true, businessName: true, isPublicOnMap: true },
  });

  let updated = 0;
  for (const profile of profiles) {
    const slug = await generateUniqueBarSlug(profile.businessName, profile.id);
    await prisma.barProfile.update({
      where: { id: profile.id },
      data: { slug },
    });
    updated += 1;
    console.log(`  ${profile.businessName} → /locales/${slug}`);
  }

  console.log(`✓ ${updated} slugs generados`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
