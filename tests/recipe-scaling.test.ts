import { describe, expect, it } from "vitest";
import {
  parseAmount,
  scaleAmount,
  estimateBaseVolumeMl,
  computeScaleFactor,
  scaleRecipe,
} from "@/lib/recipes/scaling";

describe("parseAmount", () => {
  it("parsea ml/cl/l", () => {
    expect(parseAmount("60 ml")).toEqual({ value: 60, unit: "ml", suffix: "ml" });
    expect(parseAmount("2 cl")).toEqual({ value: 2, unit: "cl", suffix: "cl" });
    expect(parseAmount("1,5 l")).toEqual({ value: 1.5, unit: "l", suffix: "l" });
  });

  it("parsea dashes y unidades", () => {
    expect(parseAmount("2 dashes")?.unit).toBe("dash");
    expect(parseAmount("3 rodajas de naranja")?.unit).toBe("unit");
  });

  it("devuelve null para no numérico", () => {
    expect(parseAmount("al gusto")).toBeNull();
  });
});

describe("scaleAmount", () => {
  it("escala volúmenes y reescala a litros cuando crece", () => {
    expect(scaleAmount("60 ml", 2)).toBe("120 ml");
    expect(scaleAmount("60 ml", 20)).toBe("1,2 l");
    expect(scaleAmount("2 cl", 100)).toBe("2 l");
  });

  it("escala unidades redondeando a enteros >= 1", () => {
    expect(scaleAmount("1 rodaja", 40)).toBe("40 rodaja");
  });

  it("deja intacto lo no numérico", () => {
    expect(scaleAmount("al gusto", 10)).toBe("al gusto");
  });
});

describe("computeScaleFactor", () => {
  it("escala por litros objetivo", () => {
    const r = computeScaleFactor({ servings: null, volumeLiters: 40, baseVolumeMl: 200, servingMl: 200 });
    expect(r.factor).toBe(200); // 40000ml / 200ml
    expect(r.totalLiters).toBe(40);
    expect(r.servings).toBe(200);
  });

  it("escala por nº de raciones", () => {
    const r = computeScaleFactor({ servings: 40, volumeLiters: null, baseVolumeMl: 120, servingMl: 120 });
    expect(r.factor).toBe(40);
    expect(r.servings).toBe(40);
    expect(r.totalLiters).toBe(4.8);
  });

  it("sin objetivo => factor 1", () => {
    const r = computeScaleFactor({ servings: null, volumeLiters: null, baseVolumeMl: 120, servingMl: 120 });
    expect(r.factor).toBe(1);
  });
});

describe("estimateBaseVolumeMl", () => {
  it("suma volúmenes reconocibles", () => {
    expect(
      estimateBaseVolumeMl([
        { name: "vermut", amount: "60 ml" },
        { name: "soda", amount: "6 cl" },
        { name: "naranja", amount: "1 rodaja" },
      ]),
    ).toBe(120);
  });

  it("usa copa estándar si no hay volúmenes", () => {
    expect(estimateBaseVolumeMl([{ name: "x", amount: "al gusto" }])).toBe(120);
  });
});

describe("scaleRecipe", () => {
  it("escala una sangría a 40 litros y añade notas de lote", () => {
    const base = [
      { name: "vino tinto", amount: "120 ml" },
      { name: "sirope", amount: "20 ml" },
      { name: "naranja", amount: "1 rodaja" },
    ];
    const res = scaleRecipe(base, { servings: null, volumeLiters: 40, isSangria: true });
    expect(res.totalLiters).toBe(40);
    expect(res.factor).toBeGreaterThan(1);
    expect(res.batchNotes.length).toBeGreaterThan(0);
    expect(res.batchNotes.join(" ")).toMatch(/macerar/i);
    // El ingrediente volumétrico principal debe haber crecido a litros.
    expect(res.ingredients[0].amount).toMatch(/ l$/);
  });

  it("no escala (factor 1) cuando es single sin objetivo", () => {
    const base = [
      { name: "vermut", amount: "60 ml" },
      { name: "soda", amount: "60 ml" },
      { name: "naranja", amount: "1 rodaja" },
    ];
    const res = scaleRecipe(base, { servings: null, volumeLiters: null });
    expect(res.factor).toBe(1);
    expect(res.servings).toBe(1);
    expect(res.batchNotes).toEqual([]);
  });
});
