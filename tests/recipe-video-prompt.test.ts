import { describe, expect, it } from "vitest";
import {
  inferCartoonMotion,
  inferStepTechnique,
  methodToVideoSteps,
  normalizeStepForScreen,
  polishedStepsToMethod,
} from "@/lib/recipes/video-prompt";

describe("recipe-video-prompt", () => {
  it("normalizes long steps and trims generic closers", () => {
    const step =
      "1. Prepara la guarnición: twist de naranja and luxardo una cereza. Sirve de inmediato, bien frío, y brinda con calma.";
    const normalized = normalizeStepForScreen(step);
    expect(normalized.length).toBeLessThanOrEqual(88);
    expect(normalized).not.toMatch(/brinda con calma/i);
  });

  it("drops steps that become punctuation-only after normalization", () => {
    const steps = methodToVideoSteps("1. Vierte ingredientes.\n2. Sirve de inmediato, bien frío.");
    expect(steps.every((s) => s.length > 3)).toBe(true);
    expect(steps).not.toContain(", .");
  });

  it("collapses verbose methods to max 5 steps", () => {
    const method = `1. Paso uno largo de preparación inicial.
2. Paso dos con hielo.
3. Paso tres remueve con cuchara.
4. Paso cuatro cuela fino.
5. Paso cinco guarnición twist.
6. Paso seis sirve frío.
7. Paso siete brinda.`;
    expect(methodToVideoSteps(method).length).toBeLessThanOrEqual(5);
  });

  it("infers shake technique and motion gag", () => {
    expect(inferStepTechnique("Agita enérgicamente 12 segundos")).toBe("shake");
    expect(inferCartoonMotion("shake").gag).toBe("shaker_pop");
    expect(inferCartoonMotion("shake").squash).toBeLessThan(1);
  });

  it("rebuilds method string from polished steps", () => {
    const method = polishedStepsToMethod(["Enfría la copa", "Remueve 30 segundos"]);
    expect(method).toContain("1. Enfría la copa");
    expect(method).toContain("2. Remueve 30 segundos");
  });
});
