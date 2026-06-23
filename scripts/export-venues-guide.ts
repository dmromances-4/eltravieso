#!/usr/bin/env tsx
/**
 * Exporta VenueGuideEntry publicados → data/venues-worlds50best.json
 * npm run export:venues
 */

import fs from "fs";
import path from "path";
import { config } from "dotenv";
import prisma from "../lib/prisma";
import { venueGuideEntryToNormalized } from "../lib/venues/guide-from-db";
import { requireDbPreflight } from "../lib/db-preflight";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const OUTPUT = path.resolve(process.cwd(), "data", "venues-worlds50best.json");

async function main() {
  await requireDbPreflight("export:venues");

  const rows = await prisma.venueGuideEntry.findMany({
    where: { isPublished: true },
    orderBy: [{ worlds50bestRank: "asc" }, { slug: "asc" }],
  });

  const venues = rows.map(venueGuideEntryToNormalized);

  if (fs.existsSync(OUTPUT)) {
    fs.copyFileSync(OUTPUT, `${OUTPUT}.bak`);
  }

  fs.writeFileSync(OUTPUT, `${JSON.stringify(venues, null, 2)}\n`, "utf-8");
  console.log(`✓ ${venues.length} locales exportados → ${OUTPUT}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
