#!/usr/bin/env tsx
/**
 * Fase 1 — Ingesta y análisis de corpus literario (EPUB)
 *
 * Usage:
 *   tsx scripts/ingest-literary-corpus.ts [--limit 5] [--dry-run] [--skip-analyze] [--no-ai]
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dryRun: false, skipAnalyze: false, useAi: true, limit: undefined as number | undefined };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--dry-run") opts.dryRun = true;
    else if (args[i] === "--skip-analyze") opts.skipAnalyze = true;
    else if (args[i] === "--no-ai") opts.useAi = false;
    else if (args[i] === "--limit") opts.limit = Number(args[++i]);
  }
  return opts;
}

async function main() {
  const [{ runLiteraryCorpusIngest }, { getCorpusPath }] = await Promise.all([
    import("@/lib/story-universe/corpus/run-ingest"),
    import("@/lib/story-universe/paths"),
  ]);
  const opts = parseArgs();
  console.log(`Corpus: ${getCorpusPath()}`);
  const result = await runLiteraryCorpusIngest({
    limit: opts.limit,
    dryRun: opts.dryRun,
    skipAnalyze: opts.skipAnalyze,
    useAi: opts.useAi,
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
