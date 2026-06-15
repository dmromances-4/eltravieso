#!/usr/bin/env tsx
/** Fase 9 — Export cocktail_universe.json */
import { config } from "dotenv";
import prisma from "@/lib/prisma";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { exportStoryUniverseJson } = await import("@/lib/story-universe/export/export-universe");
  const path = await exportStoryUniverseJson();
  console.log(JSON.stringify({ exported: path }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
