import { beforeEach, describe, expect, it, vi } from "vitest";

const { staticFixtures, findManyMock, findUniqueMock } = vi.hoisted(() => ({
  staticFixtures: [
    {
      id: "dg-1",
      title: "Sweet Martini",
      slug: "sweet-martini",
      rating: 40,
      glass: "Copa de martini",
      ingredients: ["75 ml Ginebra", "15 ml Vermut rojo El Travieso"],
      method: "Remueve y cuela.",
      abv: "30%",
      kcal: 188,
      cover: "/cocktail-placeholder.svg",
    },
    {
      id: "dg-2",
      title: "Vermouth and Soda",
      slug: "vermouth-soda",
      rating: 12,
      glass: "Vaso old fashioned",
      ingredients: ["60 ml Vermut rojo El Travieso", "120 ml Soda"],
      method: "Vierte sobre hielo y decora.",
      abv: "8%",
      kcal: 95,
      cover: "/cocktail-placeholder.svg",
    },
  ],
  findManyMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("@/data/cocktails.json", () => ({
  default: staticFixtures,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    recipe: {
      findMany: findManyMock,
      findUnique: findUniqueMock,
    },
  },
}));

import {
  getCatalogRecipes,
  getDatabaseRecipes,
  getRecipeBySlug,
} from "@/lib/recipes/catalog";

describe("recipes catalog", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    findUniqueMock.mockReset();
  });

  it("getCatalogRecipes includes all static recipes plus DB-only slugs", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "db-1",
        title: "Sweet Martini (BD)",
        slug: "sweet-martini",
        summary: "Duplicado demo",
        ingredients: '["60 ml algo"]',
        method: "English method",
        isPublished: true,
        technical: null,
      },
      {
        id: "db-2",
        title: "Cóctel IA",
        slug: "coctel-ia-nuevo",
        summary: "Solo en BD",
        ingredients: '["30 ml vermut"]',
        method: "Agitar.",
        isPublished: true,
        technical: null,
      },
    ]);

    const catalog = await getCatalogRecipes();

    expect(catalog).toHaveLength(3);
    expect(catalog.filter((r) => r.source === "static")).toHaveLength(2);
    expect(catalog.filter((r) => r.source === "database")).toHaveLength(1);
    expect(catalog.find((r) => r.slug === "sweet-martini")?.source).toBe("static");
    expect(catalog.find((r) => r.slug === "coctel-ia-nuevo")?.title).toBe("Cóctel IA");
  });

  it("getRecipeBySlug prefers static over database for duplicate slug", async () => {
    findUniqueMock.mockResolvedValue({
      id: "db-1",
      title: "Vermouth and Soda (BD)",
      slug: "vermouth-soda",
      summary: "Receta del catálogo El Travieso: Vermouth and Soda.",
      ingredients: '["60 ml"]',
      method: "POUR all ingredients into ice-filled glass.",
      isPublished: true,
      technical: null,
    });

    const recipe = await getRecipeBySlug("vermouth-soda");

    expect(recipe?.source).toBe("static");
    expect(recipe?.title).toBe("Vermouth and Soda");
    expect(recipe?.method).toContain("Vierte sobre hielo");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("getRecipeBySlug falls back to published database recipe when slug is DB-only", async () => {
    findUniqueMock.mockResolvedValue({
      id: "db-3",
      title: "Cóctel IA",
      slug: "coctel-ia-nuevo",
      summary: "Generada por Barra IA",
      ingredients: '["30 ml vermut"]',
      method: "Agitar y colar.",
      isPublished: true,
      technical: null,
    });

    const recipe = await getRecipeBySlug("coctel-ia-nuevo");

    expect(recipe?.source).toBe("database");
    expect(recipe?.title).toBe("Cóctel IA");
  });

  it("getDatabaseRecipes excludes unpublished recipes", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "db-4",
        title: "Borrador",
        slug: "borrador",
        summary: null,
        ingredients: "[]",
        method: null,
        isPublished: true,
        technical: null,
      },
    ]);

    await getDatabaseRecipes();

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isPublished: true },
      }),
    );
  });
});
