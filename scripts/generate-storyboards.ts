#!/usr/bin/env tsx
/** Fase 7 — Storyboards */
import { config } from "dotenv";
import prisma from "@/lib/prisma";

config({ path: ".env.local" });
config({ path: ".env" });

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { limit: undefined as number | undefined, storyId: undefined as string | undefined, dryRun: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--limit") opts.limit = Number(args[++i]);
    else if (args[i] === "--story-id") opts.storyId = args[++i];
    else if (args[i] === "--dry-run") opts.dryRun = true;
  }
  return opts;
}

async function main() {
  const { runGenerateStoryboards } = await import("@/lib/story-universe/storyboard/run-generate-storyboards");
  const result = await runGenerateStoryboards(parseArgs());
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
