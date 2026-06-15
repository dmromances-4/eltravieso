import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { KNOWLEDGE_BASE_DIR } from "../paths";
import type { GenerationQuota, UniverseCategory } from "../types";
import { loadKnowledgeFile } from "../knowledge/build";

const CATEGORY_DEFINITIONS: Array<{ id: string; label: string; themes: string[]; conflicts: string[]; archetypes: string[]; locations: string[] }> = [
  { id: "bars", label: "Bares", themes: ["bar_life", "alcohol"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "bartenders", label: "Camareros", themes: ["bar_life"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "gamblers", label: "Apostadores", themes: ["luck"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "musicians", label: "Músicos", themes: ["creativity"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "poets", label: "Poetas", themes: ["melancholy", "creativity"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "boxers", label: "Boxeadores", themes: ["survival"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "taxi_drivers", label: "Taxistas", themes: ["urban_life"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "travelers", label: "Viajeros", themes: ["urban_life"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "lovable_losers", label: "Fracasados entrañables", themes: ["melancholy"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "impossible_love", label: "Amores imposibles", themes: ["failed_love"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "broken_friendships", label: "Amistades rotas", themes: ["melancholy"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "night_stories", label: "Historias nocturnas", themes: ["bar_life"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "urban_stories", label: "Historias urbanas", themes: ["urban_life"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "absurd_stories", label: "Historias absurdas", themes: ["black_humor"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "black_humor", label: "Humor negro", themes: ["black_humor"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "melancholy", label: "Melancolía", themes: ["melancholy"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "redemption", label: "Redención", themes: ["redemption"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "luck", label: "Suerte", themes: ["luck"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "alcohol", label: "Alcohol", themes: ["alcohol", "bar_life"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
  { id: "creativity", label: "Creatividad", themes: ["creativity"], conflicts: ["self_sabotage"], archetypes: ["failed_poet"], locations: ["neighborhood_bar"] },
];

export const GENERATION_QUOTAS: GenerationQuota[] = [
  { categoryId: "bars", targetCount: 300, label: "Historias de bares" },
  { categoryId: "impossible_love", targetCount: 250, label: "Historias románticas" },
  { categoryId: "urban_stories", targetCount: 250, label: "Historias urbanas" },
  { categoryId: "melancholy", targetCount: 250, label: "Historias melancólicas" },
  { categoryId: "black_humor", targetCount: 200, label: "Historias humorísticas" },
  { categoryId: "absurd_stories", targetCount: 200, label: "Historias surrealistas" },
  { categoryId: "musicians", targetCount: 150, label: "Historias de músicos" },
  { categoryId: "gamblers", targetCount: 150, label: "Historias de apuestas" },
  { categoryId: "poets", targetCount: 150, label: "Historias de escritores" },
  { categoryId: "night_stories", targetCount: 100, label: "Historias experimentales" },
];

export async function buildUniverseTaxonomy(): Promise<{ categories: UniverseCategory[] }> {
  await mkdir(KNOWLEDGE_BASE_DIR, { recursive: true });

  const themesFile = await loadKnowledgeFile<{ items: Array<{ id: string }> }>("themes.json");
  const themeIds = themesFile?.items?.map((t) => t.id) ?? ["bar_life"];

  const categories: UniverseCategory[] = CATEGORY_DEFINITIONS.map((def, i) => ({
    id: def.id,
    label: def.label,
    themeIds: def.themes.filter((t) => themeIds.includes(t) || true),
    conflictIds: def.conflicts,
    archetypeIds: def.archetypes,
    locationIds: def.locations,
    weight: 1 - i * 0.02,
  }));

  await writeFile(
    path.join(KNOWLEDGE_BASE_DIR, "universe_taxonomy.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), categories }, null, 2),
    "utf8",
  );

  await writeFile(
    path.join(KNOWLEDGE_BASE_DIR, "generation_quotas.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), quotas: GENERATION_QUOTAS, totalTarget: GENERATION_QUOTAS.reduce((s, q) => s + q.targetCount, 0) }, null, 2),
    "utf8",
  );

  return { categories };
}

export async function loadUniverseCategories(): Promise<UniverseCategory[]> {
  const data = await loadKnowledgeFile<{ categories: UniverseCategory[] }>("universe_taxonomy.json");
  if (data?.categories?.length) return data.categories;
  const built = await buildUniverseTaxonomy();
  return built.categories;
}

export async function loadGenerationQuotas(): Promise<GenerationQuota[]> {
  const data = await loadKnowledgeFile<{ quotas: GenerationQuota[] }>("generation_quotas.json");
  return data?.quotas ?? GENERATION_QUOTAS;
}
