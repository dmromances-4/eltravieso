#!/usr/bin/env tsx
/**
 * Auditoría de duplicados en locales (guide vs bar) + completitud de ficha.
 * npm run audit:venue-duplicates
 */

import { config } from "dotenv";
import { resolve } from "path";
import prisma from "@/lib/prisma";
import { venueIdentityKeyFromParts } from "@/lib/venues/canonical-venue";
import { writeAuditReport } from "./lib/audit-output";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

type GuideRow = {
  id: string;
  slug: string;
  name: string;
  sourceUrl: string;
  venueCode: string | null;
  latitude: number | null;
  longitude: number | null;
  barProfileId: string | null;
  isPublished: boolean;
  photoUrl: string | null;
  history: string | null;
  verdict: string | null;
  establishmentTypes: string[];
  cuisineTypes: string[];
  idealFor: string[];
  venueFeatures: string[];
  venuePreferences: string[];
  priceRange: string | null;
  tripadvisorUrl: string | null;
  worlds50bestCategory: string;
};

function hasTaxonomy(g: GuideRow): boolean {
  return (
    g.establishmentTypes.length > 0 ||
    g.cuisineTypes.length > 0 ||
    g.idealFor.length > 0 ||
    g.venueFeatures.length > 0 ||
    g.priceRange != null
  );
}

function profileGaps(g: GuideRow): string[] {
  const gaps: string[] = [];
  if (!g.venueCode) gaps.push("venueCode");
  if (!g.photoUrl) gaps.push("photoUrl");
  if (!g.history && !g.verdict) gaps.push("historyOrVerdict");
  if (g.latitude == null || g.longitude == null) gaps.push("coords");
  if (!hasTaxonomy(g)) gaps.push("taxonomy");
  if (g.venuePreferences.length === 0) gaps.push("venuePreferences");
  if (!g.tripadvisorUrl) gaps.push("tripadvisorUrl");
  return gaps;
}

function groupByCode<T extends { venueCode: string | null; id: string; slug: string }>(
  rows: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    if (!row.venueCode) continue;
    const list = map.get(row.venueCode) ?? [];
    list.push(row);
    map.set(row.venueCode, list);
  }
  return map;
}

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
      photoUrl: true,
      history: true,
      verdict: true,
      establishmentTypes: true,
      cuisineTypes: true,
      idealFor: true,
      venueFeatures: true,
      venuePreferences: true,
      priceRange: true,
      tripadvisorUrl: true,
      worlds50bestCategory: true,
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
    .map(([sourceUrl, entries]) => ({ sourceUrl, entries }));

  const guideCodeGroups = groupByCode(guides);
  const barCodeGroups = groupByCode(bars);

  const duplicateVenueCodesInGuides = [...guideCodeGroups.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([venueCode, entries]) => ({
      venueCode,
      entries: entries.map((e) => ({ id: e.id, slug: e.slug, name: e.name })),
    }));

  const duplicateVenueCodesInBars = [...barCodeGroups.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([venueCode, entries]) => ({
      venueCode,
      entries: entries.map((e) => ({ id: e.id, slug: e.slug, name: e.businessName })),
    }));

  const crossVenueCodeConflicts: Array<{
    venueCode: string;
    guide: { id: string; slug: string; name: string };
    bar: { id: string; slug: string; name: string };
    linked: boolean;
  }> = [];

  for (const [venueCode, guideList] of guideCodeGroups) {
    const barList = barCodeGroups.get(venueCode);
    if (!barList) continue;
    for (const guide of guideList) {
      for (const bar of barList) {
        const linked = guide.barProfileId === bar.id;
        if (!linked) {
          crossVenueCodeConflicts.push({
            venueCode,
            guide: { id: guide.id, slug: guide.slug, name: guide.name },
            bar: { id: bar.id, slug: bar.slug, name: bar.businessName },
            linked: false,
          });
        }
      }
    }
  }

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

  const publishedGuides = guides.filter((g) => g.isPublished);
  const completenessRows = publishedGuides.map((g) => ({
    slug: g.slug,
    name: g.name,
    venueCode: g.venueCode,
    gaps: profileGaps(g),
    complete: profileGaps(g).length === 0,
  }));

  const gapCounts = {
    venueCode: completenessRows.filter((r) => r.gaps.includes("venueCode")).length,
    photoUrl: completenessRows.filter((r) => r.gaps.includes("photoUrl")).length,
    historyOrVerdict: completenessRows.filter((r) => r.gaps.includes("historyOrVerdict")).length,
    coords: completenessRows.filter((r) => r.gaps.includes("coords")).length,
    taxonomy: completenessRows.filter((r) => r.gaps.includes("taxonomy")).length,
    venuePreferences: completenessRows.filter((r) => r.gaps.includes("venuePreferences")).length,
    tripadvisorUrl: completenessRows.filter((r) => r.gaps.includes("tripadvisorUrl")).length,
  };

  const completeCount = completenessRows.filter((r) => r.complete).length;
  const completenessReport = {
    generatedAt: new Date().toISOString(),
    scope: "published_guides",
    totals: {
      guides: guides.length,
      publishedGuides: publishedGuides.length,
      fullyComplete: completeCount,
      fullyCompletePct:
        publishedGuides.length > 0
          ? Math.round((completeCount / publishedGuides.length) * 1000) / 10
          : 0,
      withPhoto: publishedGuides.length - gapCounts.photoUrl,
      withEditorial: publishedGuides.length - gapCounts.historyOrVerdict,
      withCoords: publishedGuides.length - gapCounts.coords,
      withTaxonomy: publishedGuides.length - gapCounts.taxonomy,
      withPreferences: publishedGuides.length - gapCounts.venuePreferences,
    },
    gapCounts,
    incomplete: completenessRows.filter((r) => !r.complete),
  };

  const duplicateVenueCodesTotal =
    duplicateVenueCodesInGuides.length +
    duplicateVenueCodesInBars.length +
    crossVenueCodeConflicts.length;

  const identityGroups = new Map<string, GuideRow[]>();
  for (const guide of guides) {
    if (!guide.name?.trim() || !guide.city?.trim()) continue;
    const key = venueIdentityKeyFromParts(
      guide.name,
      guide.city,
      guide.worlds50bestCategory as "BARS" | "RESTAURANTS",
    );
    const list = identityGroups.get(key) ?? [];
    list.push(guide);
    identityGroups.set(key, list);
  }

  const logicalDuplicates = [...identityGroups.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([identityKey, entries]) => ({
      identityKey,
      count: entries.length,
      slugs: entries.map((e) => e.slug),
      names: entries.map((e) => e.name),
    }));

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      guides: guides.length,
      bars: bars.length,
      duplicateSourceUrls: duplicateSourceUrls.length,
      duplicateVenueCodes: duplicateVenueCodesTotal,
      logicalDuplicates: logicalDuplicates.length,
      duplicatePinRisk: guideWithPublicBar.filter((g) => g.duplicatePinRisk).length,
      missingVenueCode: missingVenueCode.length,
      missingCoords: missingCoords.length,
    },
    duplicateSourceUrls,
    duplicateVenueCodes: {
      inGuides: duplicateVenueCodesInGuides,
      inBars: duplicateVenueCodesInBars,
      crossUnlinked: crossVenueCodeConflicts,
    },
    barGuideUnlinked,
    guideWithPublicBar,
    slugCollisions,
    missingVenueCode,
    missingCoords,
    logicalDuplicates,
  };

  const dupPath = writeAuditReport("venue-duplicates.json", report);
  const compPath = writeAuditReport("venue-profile-completeness.json", completenessReport);

  console.log(`✓ Informe duplicados: ${dupPath}`);
  console.log(`✓ Informe completitud: ${compPath}`);
  console.log(`  Riesgo pin duplicado: ${report.totals.duplicatePinRisk}`);
  console.log(`  ET-LOC duplicados: ${report.totals.duplicateVenueCodes}`);
  console.log(`  Duplicados lógicos (nombre+ciudad): ${report.totals.logicalDuplicates}`);
  console.log(`  Sin coords: ${missingCoords.length}`);
  console.log(
    `  Completitud (publicadas): ${completenessReport.totals.fullyComplete}/${publishedGuides.length} (${completenessReport.totals.fullyCompletePct}%)`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
