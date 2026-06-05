import { NextResponse } from "next/server";
import { searchRecipes } from "@/lib/recipes/catalog";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "recipe-search", RATE_LIMITS.recipeSearch);
  if (limited) {
    return NextResponse.json({ message: limited.message }, { status: limited.status, headers: limited.headers });
  }

  const url = new URL(request.url);
  const q = String(url.searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ matches: [] });
  }

  const matches = await searchRecipes(q, 10);

  return NextResponse.json({
    matches: matches.map((recipe) => ({
      title: recipe.title,
      slug: recipe.slug,
      summary: recipe.summary ?? null,
      ingredients: recipe.ingredients.slice(0, 5),
      source: recipe.source,
      href: `/recetas/${recipe.slug}`,
    })),
  });
}
