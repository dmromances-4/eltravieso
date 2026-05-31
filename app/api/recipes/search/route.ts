import { NextResponse } from "next/server";
import { searchRecipes } from "@/lib/recipes/catalog";

export async function GET(request: Request) {
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
