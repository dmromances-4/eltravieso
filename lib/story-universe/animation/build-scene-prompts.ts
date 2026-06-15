import {
  CARTOON_NEGATIVE_PROMPT,
  CARTOON_POSITIVE_STYLE,
  TRAVIESO_CARTOON_BRIDGE,
  wrapCartoonPrompt,
} from "@/lib/animation/classic-cartoon-prompts";
import type { AnimationPromptBundle, StoryDraft, StoryboardScene } from "../types";

export function buildSceneAnimationPrompts(
  story: StoryDraft,
  scenes: StoryboardScene[],
  episodeStyleSeed: string,
): AnimationPromptBundle[] {
  return scenes.map((scene) => {
    const base = `${scene.description}. ${story.visualIdentity.mood}. Era ${story.visualIdentity.era}. Coctel símbolo: ${story.cocktailReference}. Style seed: ${episodeStyleSeed}.`;
    const masterImagePrompt = wrapCartoonPrompt(
      `${base} ${CARTOON_POSITIVE_STYLE}. ${TRAVIESO_CARTOON_BRIDGE}`,
    );

    return {
      sceneNumber: scene.sceneNumber,
      masterImagePrompt,
      videoPrompt: `${masterImagePrompt} Subtle 2D animation, ${scene.movement}, classic cel cartoon.`,
      motionPrompt: `${scene.movement}, squash-and-stretch subtle, ${scene.camera}`,
      lightingPrompt: `${scene.lighting}, palette ${story.visualIdentity.palette.join(", ")}`,
      cameraPrompt: `${scene.camera}, staging teatral cartoon 1980s`,
      soundPrompt: `${scene.musicSuggestion}, ambiente ${scene.atmosphere}, copas y murmullos`,
      voicePrompt: `Diálogo seco natural, ritmo pausado, humor negro cuando aplique. Negative: ${CARTOON_NEGATIVE_PROMPT}`,
    };
  });
}

export function episodeStyleSeedFromStory(story: StoryDraft): string {
  return `${story.storyId}-${story.visualIdentity.mood}-${story.categoryId}`.slice(0, 64);
}
