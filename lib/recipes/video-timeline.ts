import type { RecipeVideoInput } from "@/lib/recipes/video-prompt";
import {
  attachCartoonPrompt,
  buildIntroTagline,
  buildRevealCaption,
  buildTechniqueHeadline,
  inferCartoonMotion,
  inferGlobalTechnique,
  inferMascotPoseForTechnique,
  inferStepTechnique,
  methodToVideoSteps,
  parseIngredientsForVideo,
  type VideoBeat,
} from "@/lib/recipes/video-prompt";
import { inferGarnish, inferLiquidTone } from "@/lib/recipes/image-prompt";

export const VIDEO_FPS = 30;

export type VideoTimeline = {
  beats: VideoBeat[];
  totalFrames: number;
  fps: typeof VIDEO_FPS;
  introTagline: string;
  liquidTone: string;
  garnish: string;
  sceneDurations: {
    intro: number;
    ingredients: number;
    steps: number;
    outro: number;
  };
};

export function buildVideoTimeline(
  input: RecipeVideoInput & { coverImageUrl?: string },
): VideoTimeline {
  const liquidTone = inferLiquidTone(input.ingredients);
  const garnish = inferGarnish(input.ingredients);
  const introTagline = buildIntroTagline(input);
  const steps = methodToVideoSteps(input.method ?? "");
  const globalTechnique = inferGlobalTechnique(input.method ?? "");
  const { visible, overflow } = parseIngredientsForVideo(input.ingredients);
  const hasCover = Boolean(input.coverImageUrl && !input.coverImageUrl.includes("placeholder"));

  const ctx = {
    title: input.title,
    glass: input.glass,
    liquidTone,
    garnish,
  };

  const beats: VideoBeat[] = [];

  if (hasCover) {
    beats.push(
      attachCartoonPrompt(
        {
          kind: "hook",
          durationFrames: 90,
          text: input.title,
          subtext: input.glass,
          coverImageUrl: input.coverImageUrl,
        },
        ctx,
      ),
    );
  }

  beats.push(
    attachCartoonPrompt(
      {
        kind: "brand_sting",
        durationFrames: 70,
        mascotPose: inferMascotPoseForTechnique(globalTechnique),
        text: "EL TRAVIESO",
        subtext: introTagline,
        cartoonMotion: inferCartoonMotion(globalTechnique),
      },
      ctx,
    ),
    attachCartoonPrompt(
      {
        kind: "spec_card",
        durationFrames: 120,
        text: input.title,
        subtext: `${input.glass} · ${liquidTone}`,
      },
      ctx,
    ),
    attachCartoonPrompt(
      {
        kind: "ingredients",
        durationFrames: Math.min(210, 120 + visible.length * 14),
        ingredients: visible,
        ingredientsOverflow: overflow,
        subtext: garnish,
      },
      ctx,
    ),
    attachCartoonPrompt(
      {
        kind: "technique",
        durationFrames: 90,
        technique: globalTechnique,
        text: buildTechniqueHeadline(globalTechnique),
        mascotPose: inferMascotPoseForTechnique(globalTechnique),
        cartoonMotion: inferCartoonMotion(globalTechnique),
      },
      ctx,
    ),
  );

  const stepList = steps.length ? steps : ["Preparar y servir bien frío."];
  for (const step of stepList) {
    const technique = inferStepTechnique(step);
    beats.push(
      attachCartoonPrompt(
        {
          kind: "step",
          durationFrames: 100,
          technique,
          text: step,
          mascotPose: inferMascotPoseForTechnique(technique),
          cartoonMotion: inferCartoonMotion(technique),
        },
        ctx,
      ),
    );
  }

  if (hasCover) {
    beats.push(
      attachCartoonPrompt(
        {
          kind: "reveal",
          durationFrames: 120,
          text: input.title,
          subtext: buildRevealCaption(input),
          coverImageUrl: input.coverImageUrl,
        },
        ctx,
      ),
    );
  }

  beats.push(
    attachCartoonPrompt(
      {
        kind: "outro",
        durationFrames: 90,
        text: input.title,
        subtext: "Vermut El Travieso · Recetario",
      },
      ctx,
    ),
  );

  const sumDuration = (kinds: VideoBeat["kind"][]) =>
    beats.filter((b) => kinds.includes(b.kind)).reduce((acc, b) => acc + b.durationFrames, 0);

  const sceneDurations = {
    intro: sumDuration(["hook", "brand_sting", "spec_card"]),
    ingredients: sumDuration(["ingredients"]),
    steps: sumDuration(["technique", "step"]),
    outro: sumDuration(["reveal", "outro"]),
  };

  const totalFrames = beats.reduce((acc, b) => acc + b.durationFrames, 0);

  return {
    beats,
    totalFrames,
    fps: VIDEO_FPS,
    introTagline,
    liquidTone,
    garnish,
    sceneDurations,
  };
}
