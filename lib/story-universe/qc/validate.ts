import type { CocktailNarrativeProfile, QcResult, StoryDraft } from "../types";
import { getMinOriginalityScore } from "../paths";

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-záéíóúüñ0-9\s]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  for (const t of setA) {
    if (setB.has(t)) inter += 1;
  }
  return inter / (setA.size + setB.size - inter);
}

export function validateStoryOriginality(
  draft: StoryDraft,
  existingLoglines: string[],
): QcResult {
  const issues: string[] = [];
  let maxSim = 0;
  for (const other of existingLoglines) {
    const sim = jaccardSimilarity(draft.logline, other);
    maxSim = Math.max(maxSim, sim);
  }
  const minScore = getMinOriginalityScore();
  const originalityScore = 1 - maxSim;
  if (originalityScore < minScore) {
    issues.push(`Logline demasiado similar a historia existente (${(maxSim * 100).toFixed(0)}%)`);
  }
  return { passed: issues.length === 0, score: originalityScore, issues };
}

export function validateCocktailCoherence(
  draft: StoryDraft,
  profile: CocktailNarrativeProfile,
): QcResult {
  const issues: string[] = [];
  const blob = `${draft.logline} ${draft.theme} ${JSON.stringify(draft.emotionProfile)}`.toLowerCase();
  const hookHit = profile.narrativeHooks.some((h) => {
    const words = h.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    return words.some((w) => blob.includes(w));
  });
  const cocktailMention =
    blob.includes(profile.cocktailTitle.toLowerCase()) ||
    blob.includes(profile.cocktailSlug.replace(/-/g, " "));

  if (!cocktailMention && !hookHit) {
    issues.push("Historia poco conectada con el perfil del cóctel");
  }

  return { passed: issues.length === 0, score: issues.length === 0 ? 0.9 : 0.5, issues };
}

export function validateAnimationPotential(draft: StoryDraft): QcResult {
  const issues: string[] = [];
  const score = draft.animationPotential ?? 0;
  if (score < 0.55) issues.push("animation_potential bajo");
  if (draft.locations.length < 1) issues.push("Falta al menos una locación");
  if (!draft.visualIdentity?.mood) issues.push("Falta visualIdentity.mood");

  const visualWords = (draft.logline.match(/\b(luz|bar|calle|noche|neón|lluvia|copas?|vaso)\b/gi) ?? []).length;
  if (visualWords < 1) issues.push("Logline con poco potencial visual explícito");

  return {
    passed: issues.length === 0,
    score: Math.max(score, visualWords / 5),
    issues,
  };
}

export function validateScriptRuntime(wordCount: number): QcResult {
  const mins = wordCount / 130;
  const issues: string[] = [];
  if (mins < 10 || mins > 18) {
    issues.push(`Duración estimada ${mins.toFixed(1)} min fuera de 10–18`);
  }
  return { passed: issues.length === 0, score: mins >= 10 && mins <= 18 ? 1 : 0.4, issues };
}

export function runStoryQc(
  draft: StoryDraft,
  profile: CocktailNarrativeProfile,
  existingLoglines: string[],
): QcResult {
  const checks = [
    validateStoryOriginality(draft, existingLoglines),
    validateCocktailCoherence(draft, profile),
    validateAnimationPotential(draft),
  ];
  const issues = checks.flatMap((c) => c.issues);
  const score = checks.reduce((s, c) => s + c.score, 0) / checks.length;
  return { passed: issues.length === 0, score, issues };
}
