import fs from "fs";
import path from "path";

export type SyncPhaseResult = {
  added: number;
  skipped: number;
  total: number;
  errors: number;
  notes?: string[];
};

export type CatalogSyncReport = {
  startedAt: string;
  finishedAt?: string;
  dryRun: boolean;
  skipScrape: boolean;
  seed: boolean;
  phases: {
    products?: SyncPhaseResult;
    recipes?: SyncPhaseResult;
    venues?: SyncPhaseResult;
    seed?: SyncPhaseResult;
  };
  totals: {
    added: number;
    skipped: number;
    errors: number;
  };
};

export function createReport(options: {
  dryRun: boolean;
  skipScrape: boolean;
  seed: boolean;
}): CatalogSyncReport {
  return {
    startedAt: new Date().toISOString(),
    dryRun: options.dryRun,
    skipScrape: options.skipScrape,
    seed: options.seed,
    phases: {},
    totals: { added: 0, skipped: 0, errors: 0 },
  };
}

export function finalizeReport(report: CatalogSyncReport): CatalogSyncReport {
  report.finishedAt = new Date().toISOString();
  let added = 0;
  let skipped = 0;
  let errors = 0;
  for (const phase of Object.values(report.phases)) {
    if (!phase) continue;
    added += phase.added;
    skipped += phase.skipped;
    errors += phase.errors;
  }
  report.totals = { added, skipped, errors };
  return report;
}

export function writeReport(report: CatalogSyncReport): string {
  const dir = path.resolve(process.cwd(), ".scrape-cache", "sync-catalog");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const timestamp = report.startedAt.replace(/[:.]/g, "-");
  const file = path.join(dir, `report-${timestamp}.json`);
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  return file;
}

export function printReportSummary(report: CatalogSyncReport): void {
  console.log("\n── Resumen sync:catalog ──");
  for (const [name, phase] of Object.entries(report.phases)) {
    if (!phase) continue;
    console.log(
      `  ${name}: +${phase.added} añadidos, ${phase.skipped} omitidos, ${phase.errors} errores (total ${phase.total})`,
    );
  }
  console.log(
    `  TOTAL: +${report.totals.added} añadidos, ${report.totals.skipped} omitidos, ${report.totals.errors} errores`,
  );
  if (report.dryRun) console.log("  (dry-run: sin escritura en disco/BD)");
}
