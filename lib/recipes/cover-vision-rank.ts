import { analyzeImageForRecipeCover } from "@/lib/ai/provider";
import { fetchWithTimeout } from "@/lib/recipes/fetch-with-timeout";
import type { ScoredCoverCandidate } from "@/lib/recipes/cover-reference";
import type { RecipeImageInput } from "@/lib/recipes/image-prompt";

function visionRankEnabled(): boolean {
  return process.env.RECIPE_COVER_VISION_RANK === "true";
}

function parseVisionScore(text: string): number | null {
  const match = text.match(/\b(0\.\d+|1\.0|1|0)\b/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 0 || value > 1) return null;
  return value;
}

async function fetchThumbnailBuffer(
  url: string,
  thumbnailUrl?: string,
): Promise<{ buffer: Buffer; mime: string } | null> {
  const target = thumbnailUrl ?? url;
  try {
    const res = await fetchWithTimeout(target);
    if (!res.ok) return null;
    const mime = res.headers.get("content-type") ?? "image/jpeg";
    return { buffer: Buffer.from(await res.arrayBuffer()), mime };
  } catch {
    return null;
  }
}

function buildVisionPrompt(input: RecipeImageInput): string {
  return [
    `Rate how well this photo matches the cocktail "${input.title}" served in ${input.glass || "a cocktail glass"}.`,
    `Key ingredients: ${input.ingredients.slice(0, 6).join(", ")}.`,
    "Consider liquid color, glass type, garnish, and bar/cocktail context.",
    "Reply with a single number from 0.0 to 1.0 only (1.0 = perfect match).",
  ].join(" ");
}

/** Re-rank top free-stock candidates with Gemini vision (RECIPE_COVER_VISION_RANK=true). */
export async function visionRankStockCandidates(
  candidates: ScoredCoverCandidate[],
  input: RecipeImageInput,
  topN = 3,
): Promise<ScoredCoverCandidate[]> {
  if (!visionRankEnabled()) return candidates;

  const stock = candidates.filter((c) => c.license === "free_stock").slice(0, topN);
  if (stock.length === 0) return candidates;

  const prompt = buildVisionPrompt(input);
  const visionScores = new Map<string, number>();

  for (const candidate of stock) {
    const fetched = await fetchThumbnailBuffer(candidate.url, candidate.thumbnailUrl);
    if (!fetched) continue;
    try {
      const { text } = await analyzeImageForRecipeCover(fetched.buffer, prompt, fetched.mime);
      const score = parseVisionScore(text);
      if (score != null) visionScores.set(candidate.url, score);
    } catch (error) {
      console.warn("[cover-vision] rank failed:", error instanceof Error ? error.message : error);
    }
  }

  if (visionScores.size === 0) return candidates;

  return candidates
    .map((candidate) => {
      const vision = visionScores.get(candidate.url);
      if (vision == null || candidate.license !== "free_stock") return candidate;
      return { ...candidate, score: Math.min(1, candidate.score * 0.6 + vision * 0.4) };
    })
    .sort((a, b) => b.score - a.score);
}

export function isGrayZoneScore(score: number): boolean {
  return score >= 0.45 && score <= 0.65;
}
