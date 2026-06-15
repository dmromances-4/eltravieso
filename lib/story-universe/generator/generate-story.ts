import { generateStoryAiText, shouldUseStoryAi } from "../ai/lazy-provider";
import { parseJsonObject } from "@/lib/recipes/parse";
import type { CocktailNarrativeProfile, StoryDraft, UniverseCategory } from "../types";
import { hashSeed, pickFrom } from "../slugify";
import { buildMockStoryDraft } from "./mock-story";

export function buildStoryPrompt(input: {
  profile: CocktailNarrativeProfile;
  category: UniverseCategory;
  storyIndex: number;
  storyId: string;
}): string {
  const { profile, category, storyId } = input;
  return `Eres guionista original del universo "El Travieso". Crea UNA historia completamente original.
Inspiración temática: vida urbana, bares, melancolía — NUNCA copies obras existentes ni cites autores.
El cóctel "${profile.cocktailTitle}" es disparador simbólico (no tutorial de receta).

Categoría: ${category.label}
Perfil cóctel: personalidad ${profile.personality.join(", ")}, color ${profile.color}, intensidad ${profile.intensity}/5
Ganchos: ${profile.narrativeHooks.join(" | ")}

Responde ÚNICAMENTE JSON:
{
  "storyId": "${storyId}",
  "title": "...",
  "logline": "...",
  "theme": "...",
  "subthemes": ["..."],
  "cocktailReference": "${profile.cocktailSlug}",
  "emotionProfile": { "melancolía": 0.8 },
  "characterList": [{ "name": "...", "role": "...", "archetype": "...", "motivation": "..." }],
  "locations": [{ "name": "...", "atmosphere": "..." }],
  "conflict": { "type": "...", "description": "...", "stakes": "..." },
  "resolution": { "type": "...", "description": "..." },
  "visualIdentity": { "palette": ["#F9D142"], "lighting": "...", "era": "años 70 urbano", "mood": "..." },
  "animationPotential": 0.85,
  "categoryId": "${category.id}"
}`;
}

function parseStoryDraft(raw: Record<string, unknown>, storyId: string): StoryDraft | null {
  try {
    return {
      storyId: String(raw.storyId ?? storyId),
      title: String(raw.title ?? "Sin título"),
      logline: String(raw.logline ?? ""),
      theme: String(raw.theme ?? ""),
      subthemes: Array.isArray(raw.subthemes) ? raw.subthemes.map(String) : [],
      cocktailReference: String(raw.cocktailReference ?? ""),
      emotionProfile: (raw.emotionProfile as Record<string, number>) ?? {},
      characterList: Array.isArray(raw.characterList) ? (raw.characterList as StoryDraft["characterList"]) : [],
      locations: Array.isArray(raw.locations) ? (raw.locations as StoryDraft["locations"]) : [],
      conflict: raw.conflict as StoryDraft["conflict"],
      resolution: raw.resolution as StoryDraft["resolution"],
      visualIdentity: raw.visualIdentity as StoryDraft["visualIdentity"],
      animationPotential: Number(raw.animationPotential ?? 0.7),
      categoryId: String(raw.categoryId ?? "bars"),
    };
  } catch {
    return null;
  }
}

export async function generateStoryDraft(input: {
  profile: CocktailNarrativeProfile;
  category: UniverseCategory;
  storyIndex: number;
  storyId: string;
  useAi?: boolean;
}): Promise<StoryDraft> {
  if (shouldUseStoryAi(input.useAi)) {
    try {
      const prompt = buildStoryPrompt(input);
      const text = await generateStoryAiText(prompt, { maxTokens: 1400 });
      const parsed = parseJsonObject(text);
      const draft = parsed ? parseStoryDraft(parsed, input.storyId) : null;
      if (draft && draft.logline.length > 20) return draft;
    } catch {
      /* fallback */
    }
  }
  return buildMockStoryDraft(input);
}

export function selectCategoryForQuota(
  categories: UniverseCategory[],
  quotas: Array<{ categoryId: string; targetCount: number }>,
  counts: Record<string, number>,
  seed: number,
): UniverseCategory {
  const pending = quotas.filter((q) => (counts[q.categoryId] ?? 0) < q.targetCount);
  const pool = pending.length > 0 ? pending : quotas;
  const pick = pickFrom(pool, seed, 0);
  const cat = categories.find((c) => c.id === pick.categoryId) ?? categories[0]!;
  return cat;
}

export function nextStoryId(existingCount: number): string {
  return `STORY-${String(existingCount + 1).padStart(4, "0")}`;
}

export function storySeed(cocktailSlug: string, storyIndex: number, categoryId: string): number {
  return hashSeed([cocktailSlug, String(storyIndex), categoryId]);
}
