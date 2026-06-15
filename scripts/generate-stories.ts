#!/usr/bin/env tsx
/** Fase 5 — Generador de historias */
import { config } from "dotenv";
import prisma from "@/lib/prisma";

config({ path: ".env.local" });
config({ path: ".env" });

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    limit: undefined as number | undefined,
    slug: undefined as string | undefined,
    category: undefined as string | undefined,
    force: false,
    dryRun: false,
    discoverOnly: false,
    useAi: true,
    targetTotal: undefined as number | undefined,
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === "--limit") opts.limit = Number(args[++i]);
    else if (a === "--slug") opts.slug = args[++i];
    else if (a === "--category") opts.category = args[++i];
    else if (a === "--force") opts.force = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--discover-only") opts.discoverOnly = true;
    else if (a === "--no-ai") opts.useAi = false;
    else if (a === "--target-total") opts.targetTotal = Number(args[++i]);
  }
  return opts;
}

async function main() {
  const { runGenerateStories } = await import("@/lib/story-universe/generator/run-generate-stories");
  const opts = parseArgs();
  const result = await runGenerateStories(opts);
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
