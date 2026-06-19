#!/usr/bin/env tsx
/**
 * Recalcula slugs canónicos en JSON y BD (ancla: sourceUrl).
 * npm run fix:venue-slugs
 * npm run fix:venue-slugs -- --dry-run
 */

import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { resolve } from "path";
import type { Worlds50BestCategory } from "@prisma/client";
import prisma from "@/lib/prisma";
import { dedupeSlugs } from "@/lib/venues/worlds50best-parser";
import type { NormalizedVenueGuide } from "@/lib/venues/types";
import { slugFromSourceUrl } from "@/lib/venues/unique-slug";
import { writeAuditReport } from "./lib/audit-output";
import { VENUES_DATA_FILE } from "./seed-venues-guide";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const dryRun = process.argv.includes("--dry-run");

function recalculateSlugs(venues: NormalizedVenueGuide[]): NormalizedVenueGuide[] {
  const withCanonical = venues.map((venue) => {
    const category: Worlds50BestCategory = venue.worlds50bestCategory ?? "BARS";
    const cat = category === "BARS" ? "BARS" : "RESTAURANTS";
    const canonical = slugFromSourceUrl(venue.sourceUrl, cat);
    return { ...venue, slug: canonical };
  });
  return dedupeSlugs(withCanonical);
}

export async function fixVenueSlugs(options: { dryRun?: boolean } = {}) {
  const isDryRun = options.dryRun ?? dryRun;
  const dataFile = VENUES_DATA_FILE;

  if (!fs.existsSync(dataFile)) {
    throw new Error(`No existe ${dataFile}`);
  }

  const venues = JSON.parse(fs.readFileSync(dataFile, "utf-8")) as NormalizedVenueGuide[];
  const fixed = recalculateSlugs(venues);

  const migrations = fixed
    .map((venue, i) => ({
      sourceUrl: venue.sourceUrl,
      oldSlug: venues[i]?.slug ?? venue.slug,
      newSlug: venue.slug,
      changed: venues[i]?.slug !== venue.slug,
    }))
    .filter((m) => m.changed);

  const malformedBefore = venues.filter((v) =>
    /-(bar|restaurant)-(bar|restaurant)/.test(v.slug),
  ).length;
  const malformedAfter = fixed.filter((v) =>
    /-(bar|restaurant)-(bar|restaurant)/.test(v.slug),
  ).length;

  const slugSet = new Set(fixed.map((v) => v.slug));
  if (slugSet.size !== fixed.length) {
    throw new Error("Colisión de slugs tras recálculo — abortando");
  }

  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: isDryRun,
    totals: {
      venues: venues.length,
      migrations: migrations.length,
      malformedBefore,
      malformedAfter,
    },
    migrations,
  };

  const reportPath = writeAuditReport("venue-slug-migration.json", report);
  console.log(`📋 Informe migración: ${reportPath}`);
  console.log(`  Slugs a actualizar: ${migrations.length}`);
  console.log(`  Malformados: ${malformedBefore} → ${malformedAfter}`);

  if (isDryRun) {
    console.log("  (dry-run: sin escribir JSON ni BD)");
    return report;
  }

  fs.writeFileSync(dataFile, `${JSON.stringify(fixed, null, 2)}\n`, "utf-8");
  console.log(`✓ JSON actualizado: ${dataFile}`);

  const dbRows = await prisma.venueGuideEntry.findMany({
    select: { id: true, sourceUrl: true, slug: true },
  });
  const bySource = new Map(fixed.map((v) => [v.sourceUrl, v.slug]));

  const toUpdate = dbRows.filter((row) => {
    const next = bySource.get(row.sourceUrl);
    return next != null && next !== row.slug;
  });

  if (toUpdate.length === 0) {
    console.log("✓ BD: slugs ya alineados");
    return report;
  }

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < toUpdate.length; i += 1) {
      const row = toUpdate[i];
      const tempSlug = `__migrate-${i}-${row.id.slice(0, 8)}`;
      await tx.venueGuideEntry.update({
        where: { id: row.id },
        data: { slug: tempSlug },
      });
    }

    for (const row of toUpdate) {
      const nextSlug = bySource.get(row.sourceUrl);
      if (!nextSlug) continue;
      await tx.venueGuideEntry.update({
        where: { id: row.id },
        data: { slug: nextSlug },
      });
    }
  });

  console.log(`✓ BD: ${toUpdate.length} slugs migrados`);
  return report;
}

async function main() {
  await fixVenueSlugs();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
