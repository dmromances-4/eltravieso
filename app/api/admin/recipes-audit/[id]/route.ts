import { NextResponse } from "next/server";
import { adminApiErrorResponse, requireAdminUser } from "@/lib/auth/admin-api";
import { loadCocktails } from "@/lib/recipes/cocktails-io";
import { auditRecipe } from "@/lib/recipes/audit-recipe";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireAdminUser();
  } catch (error) {
    return adminApiErrorResponse(error);
  }

  const recipes = loadCocktails();
  const recipe = recipes.find((r) => r.id === params.id || r.slug === params.id);
  if (!recipe) {
    return NextResponse.json({ message: "Receta no encontrada." }, { status: 404 });
  }

  const audit = await auditRecipe(recipe);

  return NextResponse.json({
    recipe,
    diffordsRaw: audit.diffordsRaw,
    comparison: audit.comparison,
    error: audit.error,
  });
}
