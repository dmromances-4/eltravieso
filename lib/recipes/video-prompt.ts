import {
  buildCartoonBeatPrompt,
  type CartoonBeatKind,
} from "@/lib/animation/classic-cartoon-prompts";
import { inferGarnish, inferLiquidTone, type RecipeImageInput } from "@/lib/recipes/image-prompt";
import { fixEncoding } from "@/lib/recipes/polish-recipe";

export type RecipeVideoInput = RecipeImageInput;

export type MascotPose = "idle" | "stir" | "pour" | "shake" | "present";
export type StepTechnique = "chill" | "shake" | "stir" | "strain" | "pour" | "muddle" | "garnish" | "build";
export type PhysicalGag = "shaker_pop" | "splash" | "stumble" | "double_take";

export const MAX_ON_SCREEN_STEPS = 5;
export const MAX_STEP_CHARS = 88;
export const MAX_VISIBLE_INGREDIENTS = 6;

export type ParsedIngredient = {
  amount?: string;
  name: string;
  highlight?: boolean;
};

export type CartoonMotionHint = {
  anticipationFrames: number;
  actionFrames: number;
  holdFrames: number;
  squash?: number;
  gag?: PhysicalGag | null;
};

export type VideoBeat = {
  kind: CartoonBeatKind;
  durationFrames: number;
  mascotPose?: MascotPose;
  technique?: StepTechnique;
  text?: string;
  subtext?: string;
  ingredients?: ParsedIngredient[];
  ingredientsOverflow?: number;
  coverImageUrl?: string;
  cartoonMotion?: CartoonMotionHint;
  cartoonPrompt?: string | null;
};

const GENERIC_CLOSERS = /brinda con calma|sirve de inmediato|bien fr[ií]o/gi;
const ENGLISH_FRAGMENTS: [RegExp, string][] = [
  [/pineapple wedge/gi, "rodaja de piña"],
  [/\band\b/gi, "y"],
  [/over the cocktail/gi, "sobre el cóctel"],
  [/discard/gi, ""],
  [/luxardo/gi, ""],
];

function isMeaningfulStep(step: string): boolean {
  const letters = step.replace(/[^\p{L}\p{N}]/gu, "");
  return letters.length >= 6;
}

export function normalizeStepForScreen(step: string): string {
  let value = fixEncoding(step.replace(/^\d+\.\s*/, "").trim());
  for (const [pattern, replacement] of ENGLISH_FRAGMENTS) {
    value = value.replace(pattern, replacement);
  }
  value = value.replace(GENERIC_CLOSERS, "").replace(/\s+/g, " ").trim();
  value = value.replace(/^[,.\s]+|[,.\s]+$/g, "").trim();
  if (!isMeaningfulStep(value)) return "";
  if (value.length <= MAX_STEP_CHARS) return value;
  const cut = value.slice(0, MAX_STEP_CHARS - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export function methodToVideoSteps(method: string): string[] {
  const raw = method
    .split(/\n|(?=\d+\.\s)/)
    .map((s) => s.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean)
    .map(normalizeStepForScreen)
    .filter((s) => Boolean(s) && isMeaningfulStep(s));

  if (raw.length <= MAX_ON_SCREEN_STEPS) return raw;

  const merged: string[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const line = raw[i];
    const isGarnish = /guarnici[oó]n|garnish|twist|rodaja|aceituna|cereza/i.test(line);
    const isServe = /sirve|servir|inmediato/i.test(line);
    if (isGarnish && isServe && merged.length > 0) {
      merged[merged.length - 1] = normalizeStepForScreen(`${merged[merged.length - 1]} ${line}`);
      continue;
    }
    merged.push(line);
  }

  return merged.slice(0, MAX_ON_SCREEN_STEPS);
}

export function inferStepTechnique(step: string): StepTechnique {
  const s = step.toLowerCase();
  if (/enfr[ií]a|chill|hielo y agua|descarta el hielo/.test(s)) return "chill";
  if (/agita|shake/.test(s)) return "shake";
  if (/remueve|mezcla|stir|throw/.test(s)) return "stir";
  if (/cuela|strain|fine strain|colar/.test(s)) return "strain";
  if (/vierte|pour|build|rellena/.test(s)) return "pour";
  if (/muddle|machaca|aplasta/.test(s)) return "muddle";
  if (/guarnici|garnish|twist|exprime|aceituna|cereza/.test(s)) return "garnish";
  return "build";
}

export function inferGlobalTechnique(method: string): StepTechnique {
  const m = method.toLowerCase();
  if (m.includes("shake") || m.includes("agita")) return "shake";
  if (m.includes("stir") || m.includes("remueve")) return "stir";
  if (m.includes("muddle") || m.includes("machaca")) return "muddle";
  if (m.includes("build") || m.includes("vierte")) return "pour";
  return "stir";
}

export function inferMascotPoseForTechnique(technique: StepTechnique): MascotPose {
  switch (technique) {
    case "shake":
      return "shake";
    case "stir":
    case "muddle":
      return "stir";
    case "pour":
    case "build":
    case "garnish":
      return "pour";
    default:
      return "present";
  }
}

export function inferGagFromTechnique(technique: StepTechnique): PhysicalGag | null {
  switch (technique) {
    case "shake":
      return "shaker_pop";
    case "muddle":
      return "stumble";
    default:
      return null;
  }
}

export function inferCartoonMotion(technique: StepTechnique, gag?: PhysicalGag | null): CartoonMotionHint {
  const base: CartoonMotionHint = {
    anticipationFrames: 10,
    actionFrames: 14,
    holdFrames: 8,
    gag: gag ?? inferGagFromTechnique(technique),
  };
  switch (technique) {
    case "shake":
      return { ...base, squash: 0.88, gag: gag ?? "shaker_pop" };
    case "stir":
      return { ...base, anticipationFrames: 8, actionFrames: 18, squash: 1 };
    case "pour":
      return { ...base, anticipationFrames: 8, actionFrames: 12, gag: null };
    case "muddle":
      return { ...base, gag: gag ?? "stumble" };
    default:
      return base;
  }
}

export function parseIngredientsForVideo(lines: string[]): {
  visible: ParsedIngredient[];
  overflow: number;
} {
  const parsed: ParsedIngredient[] = lines.map((line) => {
    const cleaned = fixEncoding(line.trim());
    const match = cleaned.match(/^([\d./]+\s*(?:ml|cl|dash(?:es)?|gota?s?|cucharad[ao]s?)?)\s+(.+)$/i);
    const name = match?.[2]?.trim() ?? cleaned;
    const amount = match?.[1]?.trim();
    const highlight = /el travieso|vermut rojo|bitter rojo/i.test(name);
    return { amount, name, highlight };
  });

  const visible = parsed.slice(0, MAX_VISIBLE_INGREDIENTS);
  return { visible, overflow: Math.max(0, parsed.length - MAX_VISIBLE_INGREDIENTS) };
}

export function buildIntroTagline(input: RecipeVideoInput): string {
  const tone = inferLiquidTone(input.ingredients);
  return `${input.title} · ${input.glass || "copa de autor"} · ${tone}`;
}

export function buildTechniqueHeadline(technique: StepTechnique): string {
  const labels: Record<StepTechnique, string> = {
    chill: "ENFRIAR LA COPA",
    shake: "AGITAR",
    stir: "REMOVER",
    strain: "COLAR",
    pour: "VERTER",
    muddle: "MACHACAR",
    garnish: "GUARNIR",
    build: "MONTAR EN VASO",
  };
  return labels[technique];
}

export function buildRevealCaption(input: RecipeVideoInput): string {
  return `${inferGarnish(input.ingredients)} — listo para brindar`;
}

export function buildVideoStepsPolishPrompt(input: RecipeVideoInput): string {
  return [
    "Eres guionista de vídeos cartoon de coctelería para El Travieso (español de España).",
    `Cóctel: ${input.title}. Vaso: ${input.glass}.`,
    `Ingredientes: ${input.ingredients.slice(0, 8).join("; ")}.`,
    `Método actual: ${input.method ?? ""}`,
    `Devuelve SOLO JSON: { "steps": ["...", "..."] } con 4-5 pasos imperativos, máx ${MAX_STEP_CHARS} caracteres cada uno.`,
    "Tono físico y cómico cartoon (sin diálogos). Sin marcas de cristalería comercial. Sin inglés.",
  ].join("\n");
}

export function polishedStepsToMethod(steps: string[]): string {
  return steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
}

export async function polishVideoSteps(input: RecipeVideoInput): Promise<string[] | null> {
  try {
    const { generateText } = await import("@/lib/ai/provider");
    const response = await generateText(buildVideoStepsPolishPrompt(input), { maxTokens: 700 });
    const text = response.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as { steps?: string[] };
    if (!Array.isArray(parsed.steps) || !parsed.steps.length) return null;
    return parsed.steps.map((s) => normalizeStepForScreen(String(s))).filter(Boolean);
  } catch {
    return null;
  }
}

export function attachCartoonPrompt(
  beat: VideoBeat,
  ctx: { title: string; glass: string; liquidTone: string; garnish: string },
): VideoBeat {
  const cartoonPrompt = buildCartoonBeatPrompt({
    kind: beat.kind,
    title: ctx.title,
    glass: ctx.glass,
    liquidTone: ctx.liquidTone,
    garnish: ctx.garnish,
    technique: beat.technique,
    gag: beat.cartoonMotion?.gag ?? null,
  });
  return { ...beat, cartoonPrompt };
}
