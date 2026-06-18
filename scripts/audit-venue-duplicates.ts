#!/usr/bin/env tsx
/**
 * Auditoría de duplicados en locales (guide vs bar).
 * npm run audit:venue-duplicates
 */

import { config } from "dotenv";
import { resolve } from "path";
import prisma from "@/lib/prisma";
import { writeAuditReport } from "./lib/audit-output";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const guides = await prisma.venueGuideEntry.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      sourceUrl: true,
      venueCode: true,
      latitude: true,
      longitude: true,
      barProfileId: true,
      isPublished: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const bars = await prisma.barProfile.findMany({
    select: {
      id: true,
      slug: true,
      businessName: true,
      venueCode: true,
      latitude: true,
      longitude: true,
      isPublicOnMap: true,
      guideEntry: { select: { id: true, slug: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const sourceUrlCounts = new Map<string, typeof guides>();
  for (const guide of guides) {
    if (!guide.sourceUrl) continue;
    const list = sourceUrlCounts.get(guide.sourceUrl) ?? [];
    list.push(guide);
    sourceUrlCounts.set(guide.sourceUrl, list);
  }

  const duplicateSourceUrls = [...sourceUrlCounts.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([sourceUrl, list]) => ({ sourceUrl, entries: list }));

  const barGuideUnlinked = bars
    .filter((b) => b.isPublicOnMap && !b.guideEntry)
    .map((b) => ({ barId: b.id, slug: b.slug, businessName: b.businessName }));

  const guideWithPublicBar = guides
    .filter((g) => g.barProfileId)
    .map((g) => {
      const bar = bars.find((b) => b.id === g.barProfileId);
      return {
        guideSlug: g.slug,
        guideName: g.name,
        barSlug: bar?.slug ?? null,
        barPublic: bar?.isPublicOnMap ?? false,
        duplicatePinRisk: Boolean(bar?.isPublicOnMap),
      };
    });

  const slugCollisions = guides
    .filter((g) => bars.some((b) => b.slug === g.slug))
    .map((g) => ({ slug: g.slug, guideId: g.id, guideName: g.name }));

  const missingVenueCode = [
    ...guides.filter((g) => !g.venueCode).map((g) => ({ type: "guide", slug: g.slug, name: g.name })),
    ...bars.filter((b) => !b.venueCode).map((b) => ({ type: "bar", slug: b.slug, name: b.businessName })),
  ];

  const missingCoords = [
    ...guides
      .filter((g) => g.isPublished && (g.latitude == null || g.longitude == null))
      .map((g) => ({ type: "guide", slug: g.slug, name: g.name })),
    ...bars
      .filter((b) => b.isPublicOnMap && (b.latitude == null || b.longitude == null))
      .map((b) => ({ type: "bar", slug: b.slug, name: b.businessName })),
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      guides: guides.length,
      bars: bars.length,
      duplicateSourceUrls: duplicateSourceUrls.length,
      duplicatePinRisk: guideWithPublicBar.filter((g) => g.duplicatePinRisk).length,
      missingVenueCode: missingVenueCode.length,
      missingCoords: missingCoords.length,
    },
    duplicateSourceUrls,
    barGuideUnlinked,
    guideWithPublicBar,
    slugCollisions,
    missingVenueCode,
    missingCoords,
  };

  const outPath = writeAuditReport("venue-duplicates.json", report);
  console.log(`✓ Informe: ${outPath}`);
  console.log(`  Riesgo pin duplicado: ${report.totals.duplicatePinRisk}`);
  console.log(`  Sin coords: ${missingCoords.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
