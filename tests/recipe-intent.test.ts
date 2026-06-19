import { describe, expect, it } from "vitest";
import { analyzeRequestHeuristic } from "@/lib/recipes/intent";

describe("analyzeRequestHeuristic", () => {
  it("detecta perfil dulce", () => {
    const i = analyzeRequestHeuristic("Quiero algo dulce y goloso");
    expect(i.sweetness).toBe("dulce");
    expect(i.kind).toBe("single");
  });

  it("detecta temática (Star Wars)", () => {
    const i = analyzeRequestHeuristic("Quiero un cóctel inspirado en Star Wars");
    expect(i.theme?.toLowerCase()).toContain("star wars");
    expect(i.tags).toContain("tematico");
  });

  it("detecta cóctel fácil para 40 personas como batch", () => {
    const i = analyzeRequestHeuristic("Quiero un cocktail fácil de hacer para 40 personas");
    expect(i.servings).toBe(40);
    expect(i.kind).toBe("batch");
    expect(i.difficulty).toBe("facil");
    expect(i.tags).toContain("evento");
  });

  it("detecta volumen en litros para sangría", () => {
    const i = analyzeRequestHeuristic("Quiero una receta para 40 litros de Sangría");
    expect(i.volumeLiters).toBe(40);
    expect(i.kind).toBe("batch");
    expect(i.tags).toContain("gran-volumen");
  });

  it("detecta efecto fuerte (emborracha)", () => {
    const i = analyzeRequestHeuristic("Quiero un cóctel que me emborrache");
    expect(i.effect).toBe("fuerte");
    expect(i.targetAbv).toBeGreaterThanOrEqual(25);
  });

  it("detecta efecto ligero (sin resaca)", () => {
    const i = analyzeRequestHeuristic("Quiero algo que no deje resaca");
    expect(i.effect).toBe("ligero");
    expect(i.targetAbv).toBeLessThanOrEqual(12);
  });

  it("detecta sin alcohol", () => {
    const i = analyzeRequestHeuristic("Un mocktail sin alcohol para conducir");
    expect(i.effect).toBe("sin_alcohol");
    expect(i.targetAbv).toBe(0);
  });

  it("petición neutra cae en equilibrado/single", () => {
    const i = analyzeRequestHeuristic("Un combinado con vermut rojo");
    expect(i.kind).toBe("single");
    expect(i.sweetness).toBe("equilibrado");
    expect(i.effect).toBe("neutro");
  });
});
