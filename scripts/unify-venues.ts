#!/usr/bin/env tsx
/**
 * Unifica locales duplicados por identidad (nombre+ciudad+categoría).
 * npm run unify:venues -- --dry-run
 */

import { config } from "dotenv";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { resolve } from "path";
import type { VenueGuideEntry } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  mergeVenueSiblings,
  pickCanonicalVenue,
  unifyVenueList,
  venueIdentityKey,
  venueIdentityKeyFromParts,
} from "@/lib/venues/canonical-venue";
import { venueGuideEntryToNormalized } from "@/lib/venues/guide-from-db";
import { venueGuideToDbFields } from "@/lib/venues/guide-to-db";
import { mergeVenueGuides } from "@/lib/venues/merge-guide";
import type { NormalizedVenueGuide } from "@/lib/venues/types";
import { writeAuditReport } from "./lib/audit-output";
import { VENUES_DATA_FILE } from "./seed-venues-guide";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const RESTORE_COMMIT = "6570f3d";
const dryRun = process.argv.includes("--dry-run");

function loadJson(file: string): NormalizedVenueGuide[] {
  return JSON.parse(fs.readFileSync(file, "utf-8")) as NormalizedVenueGuide[];
}

function restoreBaseJson(current: NormalizedVenueGuide[]): NormalizedVenueGuide[] {
  if (current.length >= 500) return current;

  console.log(`  JSON con ${current.length} entradas — restaurando desde ${RESTORE_COMMIT}…`);
  const raw = execSync(`git show ${RESTORE_COMMIT}:data/venues-worlds50best.json`, {
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024,
  });
  const base = JSON.parse(raw) as NormalizedVenueGuide[];
  const bySource = new Map(current.map((v) => [v.sourceUrl, v]));

  return base.map((venue) => {
    const richer = bySource.get(venue.sourceUrl);
    return richer ? mergeVenueGuides(venue, richer) : venue;
  });
}

function backupFiles(dataFile: string, timestamp: string) {
  const auditDir = resolve(process.cwd(), "data/audits");
  fs.mkdirSync(auditDir, { recursive: true });

  if (fs.existsSync(dataFile)) {
    fs.copyFileSync(dataFile, `${dataFile}.${timestamp}.bak`);
  }
}

async function unifyDatabase(
  unifiedVenues: NormalizedVenueGuide[],
  timestamp: string,
  isDryRun: boolean,
): Promise<{ updated: number; deleted: number }> {
  const rows = await prisma.venueGuideEntry.findMany();

  if (!isDryRun) {
    writeAuditReport(`venue-unify-backup-${timestamp}.json`, rows);
  }

  const groups = new Map<string, VenueGuideEntry[]>();
  for (const row of rows) {
    const key = venueIdentityKeyFromParts(row.name, row.city, row.worlds50bestCategory);
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const canonicalSourceUrls = new Set(unifiedVenues.map((v) => v.sourceUrl));
  const idsToDelete = new Set<string>();
  let updated = 0;

  for (const [, siblings] of groups) {
    if (siblings.length <= 1) continue;

    const normalized = siblings.map((row) => {
      const n = venueGuideEntryToNormalized(row);
      return { row, normalized: { ...n, venueCode: row.venueCode } };
    });

    const merged = mergeVenueSiblings(normalized.map((x) => x.normalized));
    const winnerSource = pickCanonicalVenue(normalized.map((x) => x.normalized)).sourceUrl;
    const winner = normalized.find((x) => x.normalized.sourceUrl === winnerSource)?.row
      ?? normalized[0].row;

    const coords = {
      latitude: winner.latitude,
      longitude: winner.longitude,
      geocodeConfidence: winner.geocodeConfidence,
    };

    const mergedWithCode: NormalizedVenueGuide = {
      ...merged,
      venueCode: winner.venueCode ?? merged.venueCode,
    };

    if (!isDryRun) {
      await prisma.venueGuideEntry.update({
        where: { id: winner.id },
        data: venueGuideToDbFields(mergedWithCode, coords),
      });
    }
    updated += 1;

    for (const sibling of siblings) {
      if (sibling.id !== winner.id) idsToDelete.add(sibling.id);
    }
  }

  for (const row of rows) {
    if (!canonicalSourceUrls.has(row.sourceUrl)) {
      const key = venueIdentityKeyFromParts(row.name, row.city, row.worlds50bestCategory);
      const hasCanonical = unifiedVenues.some((v) => venueIdentityKey(v) === key);
      if (hasCanonical) idsToDelete.add(row.id);
    }
  }

  if (!isDryRun && idsToDelete.size > 0) {
    await prisma.venueGuideEntry.deleteMany({
      where: { id: { in: [...idsToDelete] } },
    });
  }

  return { updated, deleted: idsToDelete.size };
}

export async function unifyVenues(options: { dryRun?: boolean } = {}) {
  const isDryRun = options.dryRun ?? dryRun;
  const dataFile = VENUES_DATA_FILE;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  if (!fs.existsSync(dataFile)) {
    throw new Error(`No existe ${dataFile}`);
  }

  const current = loadJson(dataFile);
  backupFiles(dataFile, timestamp);

  const base = restoreBaseJson(current);
  const { venues: unified, merges, identityMergeCount } = unifyVenueList(base);

  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: isDryRun,
    totals: {
      inputVenues: base.length,
      canonicalVenues: unified.length,
      identityMergeCount,
      mergeGroups: merges.length,
    },
    merges,
  };

  const reportPath = writeAuditReport("venue-canonical-merge.json", report);
  console.log(`📋 Informe: ${reportPath}`);
  console.log(`  ${base.length} → ${unified.length} locales (${identityMergeCount} fusiones)`);

  if (!isDryRun) {
    fs.writeFileSync(dataFile, `${JSON.stringify(unified, null, 2)}\n`, "utf-8");
    console.log(`✓ JSON: ${dataFile}`);
  } else {
    console.log("  (dry-run: JSON no modificado)");
  }

  const dbResult = await unifyDatabase(unified, timestamp, isDryRun);
  console.log(`  BD: ${dbResult.updated} actualizados, ${dbResult.deleted} eliminados${isDryRun ? " (dry-run)" : ""}`);

  return report;
}

async function main() {
  await unifyVenues();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
