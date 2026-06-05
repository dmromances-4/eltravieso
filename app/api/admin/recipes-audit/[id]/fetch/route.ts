import { NextResponse } from "next/server";
import { adminApiErrorResponse, requireAdminUser } from "@/lib/auth/admin-api";
import { loadCocktails } from "@/lib/recipes/cocktails-io";
import { clearDiffordsCache, fetchDiffordsRecipe } from "@/lib/diffords/fetch-recipe";
import { compareRecipes } from "@/lib/recipes/compare-recipes";

type RouteContext = { params: { id: string } };

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    await requireAdminUser();
  } catch (error) {
    return adminApiErrorResponse(error);
  }

  const recipes = loadCocktails();
  const recipe = recipes.find((r) => r.id === params.id || r.slug === params.id);
  if (!recipe?.sourceUrl) {
    return NextResponse.json({ message: "Receta sin sourceUrl." }, { status: 400 });
  }

  clearDiffordsCache(recipe.sourceUrl);

  try {
    const diffordsRaw = await fetchDiffordsRecipe(recipe.sourceUrl, { forceFetch: true });
    const comparison = compareRecipes(recipe, diffordsRaw);
    return NextResponse.json({ diffordsRaw, comparison });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener Difford's";
    return NextResponse.json({ message }, { status: 502 });
  }
}
