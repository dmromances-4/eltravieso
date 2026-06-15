#!/usr/bin/env tsx
/**
 * Smoke check del Story Universe Engine — corpus, knowledge base, Prisma, lazy AI.
 * Uso: npm run check:story-universe
 */
import { config } from "dotenv";
import { existsSync, readdirSync } from "fs";
import { join } from "path";

config({ path: ".env.local" });
config({ path: ".env" });

type CheckResult = { name: string; status: "ok" | "warn" | "fail" | "skip"; detail: string };

const KNOWLEDGE_FILES = [
  "themes.json",
  "emotions.json",
  "archetypes.json",
  "conflicts.json",
  "locations.json",
  "symbols.json",
  "relationships.json",
  "character_patterns.json",
  "narrative_patterns.json",
  "visual_patterns.json",
  "dialogue_patterns.json",
  "relations.json",
  "universe_taxonomy.json",
  "generation_quotas.json",
  "corpus_manifest.json",
];

async function checkCorpus(): Promise<CheckResult> {
  const { getCorpusPath } = await import("@/lib/story-universe/paths");
  const corpusPath = getCorpusPath();
  if (!existsSync(corpusPath)) {
    return { name: "corpus/epubs", status: "warn", detail: `No existe ${corpusPath}. Coloca EPUBs en corpus/epubs/` };
  }
  const epubs = readdirSync(corpusPath).filter((f) => f.toLowerCase().endsWith(".epub"));
  if (epubs.length === 0) {
    return { name: "corpus/epubs", status: "warn", detail: `${corpusPath} existe pero no hay .epub` };
  }
  return { name: "corpus/epubs", status: "ok", detail: `${epubs.length} EPUB(s): ${epubs.join(", ")}` };
}

function checkKnowledgeBase(): CheckResult {
  const kbDir = join(process.cwd(), "knowledge_base");
  if (!existsSync(kbDir)) {
    return { name: "knowledge_base", status: "fail", detail: "Directorio knowledge_base/ ausente. Ejecuta ingest + build:knowledge-base." };
  }
  const missing = KNOWLEDGE_FILES.filter((f) => !existsSync(join(kbDir, f)));
  if (missing.length > 0) {
    return {
      name: "knowledge_base",
      status: "warn",
      detail: `Faltan ${missing.length} JSON: ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? "…" : ""}. Ejecuta build:knowledge-base.`,
    };
  }
  return { name: "knowledge_base", status: "ok", detail: `${KNOWLEDGE_FILES.length} archivos JSON presentes` };
}

async function checkPrismaTables(): Promise<CheckResult> {
  try {
    const prisma = (await import("@/lib/prisma")).default;
    await prisma.$queryRaw`SELECT 1 FROM "CocktailNarrativeProfile" LIMIT 1`;
    await prisma.$queryRaw`SELECT 1 FROM "Story" LIMIT 1`;
    await prisma.$disconnect();
    return { name: "prisma_story_tables", status: "ok", detail: "Tablas CocktailNarrativeProfile y Story accesibles" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("does not exist") || msg.includes("P2021")) {
      return {
        name: "prisma_story_tables",
        status: "fail",
        detail: "Migración story-universe no aplicada. Ejecuta npm run db:setup o prisma migrate deploy.",
      };
    }
    return { name: "prisma_story_tables", status: "warn", detail: `No se pudo verificar BD: ${msg.slice(0, 120)}` };
  }
}

async function checkLazyAi(): Promise<CheckResult> {
  const { shouldUseStoryAi } = await import("@/lib/story-universe/ai/lazy-provider");
  const { isTextAiAvailable, isDevelopmentMockEnabled } = await import("@/lib/ai/availability");
  const mock = isDevelopmentMockEnabled();
  const ai = isTextAiAvailable();
  const wouldUse = shouldUseStoryAi(true);
  const detail = mock
    ? "AI_MOCK=true — pipeline usa mocks sin cargar provider"
    : ai
      ? "Claves IA detectadas — provider se carga solo bajo demanda"
      : "Sin claves IA — usa --no-ai o AI_MOCK=true para ingest/generate";
  return {
    name: "lazy_ai",
    status: ai || mock ? "ok" : "warn",
    detail: `${detail} (wouldUseAi=${wouldUse})`,
  };
}

async function main() {
  console.log("\n=== Story Universe — check ===\n");
  const results: CheckResult[] = [
    await checkCorpus(),
    checkKnowledgeBase(),
    await checkPrismaTables(),
    await checkLazyAi(),
  ];

  let failures = 0;
  for (const r of results) {
    const icon = r.status === "ok" ? "✓" : r.status === "fail" ? "✗" : r.status === "warn" ? "!" : "-";
    console.log(`${icon} [${r.status}] ${r.name}: ${r.detail}`);
    if (r.status === "fail") failures += 1;
  }

  console.log("");
  if (failures > 0) {
    console.log(`${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log("Story Universe listo para pipeline (--no-ai funciona sin provider).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
