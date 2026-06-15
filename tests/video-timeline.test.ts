import { describe, expect, it } from "vitest";
import { buildVideoTimeline } from "@/lib/recipes/video-timeline";
import { recipeToVideoProps } from "@/lib/recipes/video-composition-data";

const sampleInput = {
  title: "Negroni",
  glass: "Vaso old fashioned",
  ingredients: ["30 ml Vermut rojo El Travieso", "30 ml gin", "30 ml Campari", "1 rodaja de naranja"],
  method:
    "1. Enfría el vaso con hielo.\n2. Vierte ingredientes en vaso mezclador.\n3. Remueve 30 segundos.\n4. Cuela en vaso con hielo.\n5. Guarnición de naranja.",
  coverImageUrl: "https://example.com/negroni.jpg",
};

describe("video-timeline", () => {
  it("builds beats with cartoon prompts and motion", () => {
    const timeline = buildVideoTimeline(sampleInput);
    expect(timeline.beats.length).toBeGreaterThan(6);
    const technique = timeline.beats.find((b) => b.kind === "technique");
    expect(technique?.cartoonPrompt).toBeTruthy();
    expect(technique?.cartoonMotion?.anticipationFrames).toBeGreaterThan(0);
  });

  it("includes hook and reveal when cover is present", () => {
    const timeline = buildVideoTimeline(sampleInput);
    expect(timeline.beats.some((b) => b.kind === "hook")).toBe(true);
    expect(timeline.beats.some((b) => b.kind === "reveal")).toBe(true);
  });

  it("totalFrames equals sum of beat durations", () => {
    const timeline = buildVideoTimeline(sampleInput);
    const sum = timeline.beats.reduce((acc, b) => acc + b.durationFrames, 0);
    expect(timeline.totalFrames).toBe(sum);
    expect(timeline.totalFrames).toBeGreaterThan(800);
  });

  it("recipeToVideoProps flattens beats for Remotion", () => {
    const timeline = buildVideoTimeline(sampleInput);
    const props = recipeToVideoProps(sampleInput);
    expect(props.beats?.length).toBe(timeline.beats.length);
    expect(props.totalFrames).toBe(timeline.totalFrames);
    expect(props.steps.length).toBeGreaterThan(0);
    expect(props.sceneDurations?.intro).toBeGreaterThan(0);
  });
});
