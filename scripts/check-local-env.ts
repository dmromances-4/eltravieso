#!/usr/bin/env tsx
/**
 * Diagnóstico del entorno local — BD, migraciones, URLs auth, Bar Online, claves opcionales.
 * Uso: npm run check:local
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const { getDevHealthReport, hasDevIssues } = await import("@/lib/dev/health");
  const report = await getDevHealthReport();

  console.log("\n=== El Travieso — check local ===\n");
  console.log(`Database:   ${report.database}`);
  console.log(`Migrations: ${report.migrations}`);
  console.log(`WebSocket:  ${report.ws}`);
  console.log(`Auth URLs:  ${report.authUrls}`);
  console.log("\nFeatures:");
  console.log(`  Pantalla TMDB: ${report.features.pantallaTmdb ? "ok" : "off"}`);
  console.log(`  Bar Online:    ${report.features.barOnline ? "ok" : "off"}`);
  console.log(`  Agente IA:     ${report.features.aiAgent ? "ok" : "off"}`);
  console.log(`  Supabase:      ${report.features.supabaseUploads ? "ok" : "off"}`);

  if (report.warnings.length > 0) {
    console.log("\nAvisos:");
    for (const w of report.warnings) console.log(`  • ${w}`);
  }

  console.log("\nPerfiles DATABASE_URL:");
  console.log("  Docker:    postgresql://postgres:postgres@localhost:5432/vermut");
  console.log("  Embedded:  postgresql://postgres:postgres@localhost:5433/vermut");
  console.log("\nSiempre abre: http://localhost:3000 (no 127.0.0.1)\n");

  process.exit(hasDevIssues(report) ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
