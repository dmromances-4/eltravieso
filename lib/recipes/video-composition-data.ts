import { buildVideoTimeline, type VideoTimeline } from "@/lib/recipes/video-timeline";
import type { VideoBeat, MascotPose } from "@/lib/recipes/video-prompt";

export type RecipeVideoProps = {
  title: string;
  glass: string;
  ingredients: string[];
  steps: string[];
  coverImageUrl?: string;
  mascotPose?: MascotPose;
  introTagline?: string;
  liquidTone?: string;
  garnish?: string;
  totalFrames?: number;
  sceneDurations?: VideoTimeline["sceneDurations"];
  beats?: VideoBeat[];
};

export function inferMascotPose(method: string): RecipeVideoProps["mascotPose"] {
  const m = method.toLowerCase();
  if (m.includes("shake")) return "shake";
  if (m.includes("stir")) return "stir";
  if (m.includes("pour") || m.includes("build")) return "pour";
  return "present";
}

export function methodToSteps(method: string): string[] {
  return method
    .split(/\n|(?=\d+\.\s)/)
    .map((s) => s.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

export function recipeToVideoProps(input: {
  title: string;
  glass: string;
  ingredients: string[];
  method: string;
  coverImageUrl?: string;
}): RecipeVideoProps {
  const timeline = buildVideoTimeline(input);
  const stepTexts = timeline.beats
    .filter((b) => b.kind === "step")
    .map((b) => b.text)
    .filter((t): t is string => Boolean(t));

  const techniqueBeat = timeline.beats.find((b) => b.kind === "technique");

  return {
    title: input.title,
    glass: input.glass,
    ingredients: input.ingredients.slice(0, 8),
    steps: stepTexts.length ? stepTexts : ["Preparar y servir bien frío."],
    coverImageUrl: input.coverImageUrl,
    mascotPose: techniqueBeat?.mascotPose ?? inferMascotPose(input.method),
    introTagline: timeline.introTagline,
    liquidTone: timeline.liquidTone,
    garnish: timeline.garnish,
    totalFrames: timeline.totalFrames,
    sceneDurations: timeline.sceneDurations,
    beats: timeline.beats,
  };
}

export function recipeToVideoTimeline(input: {
  title: string;
  glass: string;
  ingredients: string[];
  method: string;
  coverImageUrl?: string;
}): VideoTimeline {
  return buildVideoTimeline(input);
}
