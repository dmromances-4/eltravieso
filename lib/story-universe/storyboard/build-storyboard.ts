import type { StoryDraft, StoryScriptPayload, StoryboardScene } from "../types";

const TARGET_RUNTIME_SECS = 14 * 60;
const SCENE_COUNT = 50;

export function buildStoryboardFromScript(
  story: StoryDraft,
  script: StoryScriptPayload,
): StoryboardScene[] {
  const scenes: StoryboardScene[] = [];
  const avgDuration = Math.floor(TARGET_RUNTIME_SECS / SCENE_COUNT);
  let sceneNumber = 1;

  for (const act of script.screenplay.acts) {
    for (const beat of act.beats) {
      scenes.push({
        sceneNumber,
        description: `${beat.heading}. ${beat.action}`.slice(0, 400),
        camera: sceneNumber % 3 === 0 ? "primer plano" : "plano medio",
        movement: sceneNumber % 4 === 0 ? "travelling lento" : "estático con push-in",
        lighting: story.visualIdentity.lighting,
        atmosphere: story.locations[0]?.atmosphere ?? story.visualIdentity.mood,
        musicSuggestion: beat.emotion.includes("melanc") ? "jazz lo-fi" : "silencio tenso con contrabajo",
        durationSecs: avgDuration,
      });
      sceneNumber += 1;
    }
  }

  while (scenes.length < 40) {
    scenes.push({
      sceneNumber: scenes.length + 1,
      description: `Transición visual: ${story.title} — ${story.visualIdentity.mood}`,
      camera: "gran plano general",
      movement: "paneo",
      lighting: story.visualIdentity.lighting,
      atmosphere: "bar cartoon clásico",
      musicSuggestion: "ambient bar",
      durationSecs: avgDuration,
    });
  }

  const total = scenes.reduce((s, sc) => s + sc.durationSecs, 0);
  if (total < 600 || total > 1080) {
    const factor = TARGET_RUNTIME_SECS / total;
    for (const sc of scenes) sc.durationSecs = Math.max(12, Math.round(sc.durationSecs * factor));
  }

  return scenes.slice(0, 80);
}
