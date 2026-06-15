#!/usr/bin/env tsx
/** Fase 4 — Perfiles narrativos de cócteles */
import { config } from "dotenv";
import prisma from "@/lib/prisma";

config({ path: ".env.local" });
config({ path: ".env" });

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { limit: undefined as number | undefined, slug: undefined as string | undefined, dryRun: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--limit") opts.limit = Number(args[++i]);
    else if (args[i] === "--slug") opts.slug = args[++i];
    else if (args[i] === "--dry-run") opts.dryRun = true;
  }
  return opts;
}

async function main() {
  const { runBuildCocktailProfiles } = await import("@/lib/story-universe/cocktail/persist-profiles");
  const opts = parseArgs();
  const result = await runBuildCocktailProfiles(opts);
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
