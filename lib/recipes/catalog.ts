import cocktailsData from "@/data/cocktails.json";
import prisma from "@/lib/prisma";
import type { CocktailRecord } from "@/types/cocktail";
import { parseStoredIngredients } from "@/lib/recipes/parse";

export type CatalogRecipe = CocktailRecord & {
  summary?: string;
  source: "static" | "database";
};

const staticCocktails = cocktailsData as CocktailRecord[];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokenizeQuery(query: string) {
  return normalizeText(query)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function scoreRecipe(recipe: CatalogRecipe, tokens: string[]) {
  if (!tokens.length) return 0;

  const haystack = normalizeText(
    [recipe.title, recipe.summary ?? "", recipe.glass, recipe.method, ...recipe.ingredients].join(" "),
  );

  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

function staticToCatalog(recipe: CocktailRecord): CatalogRecipe {
  return { ...recipe, source: "static" };
}

function dbToCatalog(recipe: {
  title: string;
  slug: string;
  summary: string | null;
  ingredients: string;
  method: string | null;
  technical?: { abv: number | null; imageUrl: string | null } | null;
}): CatalogRecipe {
  const ingredients = parseStoredIngredients(recipe.ingredients);
  const abvValue = recipe.technical?.abv;

  return {
    title: recipe.title,
    slug: recipe.slug,
    summary: recipe.summary ?? undefined,
    rating: 8,
    glass: "Copa de autor",
    ingredients: ingredients.length > 0 ? ingredients : ["Consultar ficha para cantidades"],
    method: recipe.method ?? "Preparar y servir bien frío.",
    abv: abvValue != null ? `${abvValue}%` : "—",
    kcal: 120,
    cover: recipe.technical?.imageUrl ?? "/cocktail-placeholder.svg",
    source: "database",
  };
}

export async function getDatabaseRecipes(): Promise<CatalogRecipe[]> {
  const rows = await prisma.recipe.findMany({
    include: { technical: true },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => dbToCatalog(row));
}

export async function getCatalogRecipes(): Promise<CatalogRecipe[]> {
  const dbRecipes = await getDatabaseRecipes();
  const dbSlugs = new Set(dbRecipes.map((recipe) => recipe.slug));
  const staticFiltered = staticCocktails
    .filter((recipe) => !dbSlugs.has(recipe.slug))
    .map(staticToCatalog);

  return [...dbRecipes, ...staticFiltered];
}

export async function getRecipeBySlug(slug: string): Promise<CatalogRecipe | null> {
  const dbRecipe = await prisma.recipe.findUnique({
    where: { slug },
    include: { technical: true },
  });

  if (dbRecipe) return dbToCatalog(dbRecipe);

  const staticRecipe = staticCocktails.find((item) => item.slug === slug);
  return staticRecipe ? staticToCatalog(staticRecipe) : null;
}

export function searchCatalog(recipes: CatalogRecipe[], query: string, limit = 6): CatalogRecipe[] {
  const tokens = tokenizeQuery(query);
  if (!tokens.length) return [];

  return [...recipes]
    .map((recipe) => ({ recipe, score: scoreRecipe(recipe, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.recipe);
}

export async function searchRecipes(query: string, limit = 6): Promise<CatalogRecipe[]> {
  const catalog = await getCatalogRecipes();
  return searchCatalog(catalog, query, limit);
}

export function buildSearchContext(matches: CatalogRecipe[]): string {
  if (!matches.length) {
    return "No hay recetas similares en el catálogo. Crea una receta original coherente con el briefing.";
  }

  const lines = matches.map((recipe, index) => {
    const ingredientPreview = recipe.ingredients.slice(0, 4).join("; ");
    return `${index + 1}. ${recipe.title} (${recipe.slug}) — ${ingredientPreview}`;
  });

  return `Recetas del catálogo que pueden inspirar o adaptarse (úsalo como referencia, no copies literalmente):\n${lines.join("\n")}`;
}
