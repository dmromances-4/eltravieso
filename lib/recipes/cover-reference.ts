import {
  type CoverCandidate,
  titleMatchScore,
} from "@/lib/recipes/cover-discovery";
import type { RecipeImageInput } from "@/lib/recipes/image-prompt";
import { inferLiquidTone } from "@/lib/recipes/image-prompt";

export type ScoredCoverCandidate = CoverCandidate & { score: number };

const MIN_WIDTH = 600;
const MIN_HEIGHT = 750;

const NON_COCKTAIL_PATTERN = /\b(wine|beer|coffee|latte|espresso cup|tea cup|milkshake|smoothie)\b/i;

const SPIRIT_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /gin|ginebra/i, label: "gin" },
  { pattern: /whisky|whiskey|bourbon|scotch|rye/i, label: "whiskey" },
  { pattern: /rum|ron/i, label: "rum" },
  { pattern: /tequila|mezcal|agave/i, label: "tequila" },
  { pattern: /vermut|vermouth|bitter|campari|aperol/i, label: "vermouth" },
];

export function spiritKeywordsFromIngredients(ingredients: string[]): string[] {
  const haystack = ingredients.join(" ").toLowerCase();
  return SPIRIT_PATTERNS.filter(({ pattern }) => pattern.test(haystack)).map(({ label }) => label);
}

export function stockMinScore(): number {
  const raw = process.env.RECIPE_COVER_STOCK_MIN_SCORE;
  const parsed = raw ? Number(raw) : 0.5;
  return Number.isFinite(parsed) ? parsed : 0.5;
}

function orientationScore(width?: number, height?: number): number {
  if (!width || !height) return 0.4;
  if (height >= width * 1.1) return 1;
  if (height >= width) return 0.75;
  return 0.35;
}

function resolutionScore(width?: number, height?: number): number {
  if (!width || !height) return 0.3;
  const minSide = Math.min(width, height);
  const maxSide = Math.max(width, height);
  if (minSide >= MIN_WIDTH && maxSide >= MIN_HEIGHT) return 1;
  if (minSide >= 480) return 0.6;
  return 0.25;
}

export function scoreCoverCandidate(candidate: CoverCandidate, input: RecipeImageInput): number {
  const textBlob = [candidate.alt, candidate.attribution, candidate.url].filter(Boolean).join(" ");
  const titleScore = titleMatchScore(input.title, textBlob);
  const orient = orientationScore(candidate.width, candidate.height);
  const res = resolutionScore(candidate.width, candidate.height);

  let sourceBonus = 0;
  if (candidate.license === "free_stock") sourceBonus = 0.06;
  if (candidate.license === "diffords_reference") sourceBonus = 0.04;

  const cocktailHint = /cocktail|drink|bar|mixology|bartender|liquor|spirit/i.test(textBlob) ? 0.12 : 0;

  const spirits = spiritKeywordsFromIngredients(input.ingredients);
  const spiritHint =
    spirits.length > 0 && spirits.some((s) => textBlob.toLowerCase().includes(s)) ? 0.1 : 0;

  const liquidTone = inferLiquidTone(input.ingredients).toLowerCase();
  const toneTokens = liquidTone.split(/[\s,]+/).filter((t) => t.length > 4);
  const toneHint =
    toneTokens.length > 0 && toneTokens.some((t) => textBlob.toLowerCase().includes(t)) ? 0.05 : 0;

  const nonCocktailPenalty = NON_COCKTAIL_PATTERN.test(textBlob) ? 0.15 : 0;

  const score =
    titleScore * 0.25 +
    orient * 0.2 +
    res * 0.15 +
    cocktailHint +
    spiritHint +
    toneHint +
    sourceBonus -
    nonCocktailPenalty;
  return Math.min(1, Math.max(0, score));
}

export function scoreCoverCandidates(
  candidates: CoverCandidate[],
  input: RecipeImageInput,
): ScoredCoverCandidate[] {
  return candidates
    .map((candidate) => ({
      ...candidate,
      score: scoreCoverCandidate(candidate, input),
    }))
    .sort((a, b) => b.score - a.score);
}

export function pickBestFreeStock(candidates: ScoredCoverCandidate[]): ScoredCoverCandidate | null {
  const min = stockMinScore();
  return candidates.find((c) => c.license === "free_stock" && c.score >= min) ?? null;
}

export function pickBestReference(candidates: ScoredCoverCandidate[]): ScoredCoverCandidate | null {
  const diffords = candidates.find((c) => c.license === "diffords_reference");
  if (diffords) return diffords;
  return candidates.find((c) => c.license === "free_stock" && c.score >= 0.35) ?? null;
}
