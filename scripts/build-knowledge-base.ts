#!/usr/bin/env tsx
/** Fase 2 — Normalizar knowledge_base */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { runBuildKnowledgeBase } = await import("@/lib/story-universe/knowledge/build");
  const { buildUniverseTaxonomy } = await import("@/lib/story-universe/taxonomy/universe");
  const kb = await runBuildKnowledgeBase();
  const tax = await buildUniverseTaxonomy();
  console.log(JSON.stringify({ ...kb, categories: tax.categories.length }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
