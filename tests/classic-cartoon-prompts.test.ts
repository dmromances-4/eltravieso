import { describe, expect, it } from "vitest";
import {
  CARTOON_NEGATIVE_PROMPT,
  buildCartoonBeatPrompt,
  inferGagFromPrompt,
  promptAgitadoElastico,
  promptMaestroPicaro,
  wrapCartoonPrompt,
} from "@/lib/animation/classic-cartoon-prompts";

describe("classic-cartoon-prompts", () => {
  it("wraps prompts with brand and style suffix", () => {
    const prompt = promptAgitadoElastico();
    expect(prompt).toContain("1980s");
    expect(prompt).toContain("#2B87B9");
    expect(prompt).not.toContain("Daniel el Travieso");
  });

  it("builds technique beat prompt for shake", () => {
    const prompt = buildCartoonBeatPrompt({ kind: "technique", technique: "shake" });
    expect(prompt).toMatch(/shaking|shaker/i);
  });

  it("exposes negative prompt for IA tools", () => {
    expect(CARTOON_NEGATIVE_PROMPT).toContain("photorealistic");
    expect(wrapCartoonPrompt("test scene")).toContain("test scene");
  });

  it("maps technique to gag ids", () => {
    expect(inferGagFromPrompt("shake")).toBe("shaker_pop");
    expect(inferGagFromPrompt("muddle")).toBe("stumble");
    expect(inferGagFromPrompt("stir")).toBeNull();
  });

  it("returns unique strings per prompt function", () => {
    const a = promptMaestroPicaro();
    const b = promptAgitadoElastico();
    expect(a).not.toBe(b);
  });
});
