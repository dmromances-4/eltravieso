import cocktailsData from "@/data/cocktails.json";
import prisma from "@/lib/prisma";
import type { CocktailRecord } from "@/types/cocktail";
import { parseStoredIngredients } from "@/lib/recipes/parse";

export type CatalogRecipe = CocktailRecord & {
  summary?: string;
  videoUrl?: string;
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
  glass?: string | null;
  imageUrl?: string | null;
  ingredients: string;
  method: string | null;
  videoUrl?: string | null;
  technical?: { abv: number | null; imageUrl: string | null } | null;
}): CatalogRecipe {
  const ingredients = parseStoredIngredients(recipe.ingredients);
  const abvValue = recipe.technical?.abv;
  const cover =
    recipe.imageUrl ??
    recipe.technical?.imageUrl ??
    "/cocktail-placeholder.svg";

  return {
    title: recipe.title,
    slug: recipe.slug,
    summary: recipe.summary ?? undefined,
    videoUrl: recipe.videoUrl ?? undefined,
    rating: 8,
    glass: recipe.glass ?? "Copa de autor",
    ingredients: ingredients.length > 0 ? ingredients : ["Consultar ficha para cantidades"],
    method: recipe.method ?? "Preparar y servir bien frío.",
    abv: abvValue != null ? `${abvValue}%` : "—",
    kcal: 120,
    cover,
    source: "database",
  };
}

export async function getDatabaseRecipes(): Promise<CatalogRecipe[]> {
  // Tolerante a fallos: si la BD no responde (sin red/local caída), devolvemos
  // [] para que el catálogo siga mostrando las recetas estáticas de cocktails.json.
  try {
    const rows = await prisma.recipe.findMany({
      include: { technical: true },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((row) => dbToCatalog(row));
  } catch (error) {
    console.error("[catalog] getDatabaseRecipes falló, usando recetas estáticas:", error);
    return [];
  }
}

export async function getCatalogRecipes(): Promise<CatalogRecipe[]> {
  const dbRecipes = await getDatabaseRecipes();
  if (dbRecipes.length > 0) {
    const dbSlugs = new Set(dbRecipes.map((recipe) => recipe.slug));
    const staticFiltered = staticCocktails
      .filter((recipe) => !dbSlugs.has(recipe.slug))
      .map(staticToCatalog);
    return [...dbRecipes, ...staticFiltered];
  }

  return staticCocktails.map(staticToCatalog);
}

export async function getRecipeBySlug(slug: string): Promise<CatalogRecipe | null> {
  try {
    const dbRecipe = await prisma.recipe.findUnique({
      where: { slug },
      include: { technical: true },
    });

    if (dbRecipe) return dbToCatalog(dbRecipe);
  } catch (error) {
    console.error("[catalog] getRecipeBySlug falló, usando recetas estáticas:", error);
  }

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

export async function searchRecipesInDb(query: string, limit = 6): Promise<CatalogRecipe[]> {
  const tokens = tokenizeQuery(query);
  if (!tokens.length) return [];

  try {
    const rows = await prisma.recipe.findMany({
      where: {
        isPublished: true,
        OR: tokens.flatMap((token) => [
          { title: { contains: token, mode: "insensitive" as const } },
          { summary: { contains: token, mode: "insensitive" as const } },
          { ingredients: { contains: token, mode: "insensitive" as const } },
          { glass: { contains: token, mode: "insensitive" as const } },
        ]),
      },
      include: { technical: true },
      orderBy: { updatedAt: "desc" },
      take: Math.max(limit * 3, 12),
    });

    const dbResults = rows.map((row) => dbToCatalog(row));
    return searchCatalog(dbResults, query, limit);
  } catch (error) {
    console.error("[catalog] searchRecipesInDb falló:", error);
    return [];
  }
}

export async function getRelatedRecipes(slug: string, limit = 3): Promise<CatalogRecipe[]> {
  try {
    const rows = await prisma.recipe.findMany({
      where: { slug: { not: slug }, isPublished: true },
      include: { technical: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    if (rows.length > 0) {
      return rows.map((row) => dbToCatalog(row));
    }
  } catch (error) {
    console.error("[catalog] getRelatedRecipes falló:", error);
  }

  const catalog = await getCatalogRecipes();
  return catalog.filter((r) => r.slug !== slug).slice(0, limit);
}

export async function searchRecipes(query: string, limit = 6): Promise<CatalogRecipe[]> {
  const dbMatches = await searchRecipesInDb(query, limit);
  if (dbMatches.length >= limit) return dbMatches;

  const catalog = await getCatalogRecipes();
  const staticMatches = searchCatalog(catalog, query, limit);
  const seen = new Set(dbMatches.map((r) => r.slug));
  const merged = [...dbMatches];

  for (const recipe of staticMatches) {
    if (merged.length >= limit) break;
    if (!seen.has(recipe.slug)) {
      merged.push(recipe);
      seen.add(recipe.slug);
    }
  }

  return merged;
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
