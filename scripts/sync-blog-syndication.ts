#!/usr/bin/env tsx
import { runBlogSyndication, type SyndicationKind } from "@/lib/blog/syndication";

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function main() {
  const kind = (argValue("--kind") ?? "all") as SyndicationKind;
  const sinceRaw = argValue("--since") ?? "2026-01-01";
  const since = new Date(sinceRaw);
  if (Number.isNaN(since.getTime())) {
    console.error("Fecha --since inválida");
    process.exit(1);
  }

  const results = await runBlogSyndication({
    kind,
    since,
    writerSlug: argValue("--writer"),
    limit: Number(argValue("--limit") ?? "20") || 20,
    dryRun: process.argv.includes("--dry-run"),
    forceFetch: process.argv.includes("--force-fetch"),
  });

  for (const result of results) {
    console.log(
      `[${result.kind}] imported=${result.imported} skipped=${result.skipped} errors=${result.errors.length}`,
    );
    for (const err of result.errors) console.error(`  - ${err}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
