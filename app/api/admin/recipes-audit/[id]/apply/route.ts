import { NextResponse } from "next/server";
import { adminApiErrorResponse, requireAdminUser } from "@/lib/auth/admin-api";
import {
  loadCocktails,
  saveCocktails,
  updateRecipeById,
} from "@/lib/recipes/cocktails-io";
import {
  applyDiffordsToRecipe,
  auditRecipe,
  markRecipeReviewed,
} from "@/lib/recipes/audit-recipe";
import type { CocktailRecord } from "@/types/cocktail";

type RouteContext = { params: { id: string } };

export async function POST(request: Request, { params }: RouteContext) {
  try {
    await requireAdminUser();
  } catch (error) {
    return adminApiErrorResponse(error);
  }

  const body = await request.json();
  const source = String(body.source ?? "") as "local" | "diffords" | "custom" | "ok" | "manual";
  const notes = body.notes != null ? String(body.notes) : undefined;

  let recipes = loadCocktails();
  const recipe = recipes.find((r) => r.id === params.id || r.slug === params.id);
  if (!recipe) {
    return NextResponse.json({ message: "Receta no encontrada." }, { status: 404 });
  }

  let updated: CocktailRecord = recipe;

  if (source === "local" || source === "ok") {
    updated = markRecipeReviewed(recipe, "ok", notes ?? "Mantenida versión local");
  } else if (source === "manual") {
    updated = markRecipeReviewed(recipe, "manual", notes ?? "Requiere revisión manual");
  } else if (source === "diffords") {
    const audit = await auditRecipe(recipe);
    if (!audit.diffordsRaw) {
      return NextResponse.json(
        { message: audit.error ?? "No se pudo obtener Difford's." },
        { status: 502 },
      );
    }
    updated = applyDiffordsToRecipe(recipe, audit.diffordsRaw, notes);
  } else if (source === "custom" && body.recipe && typeof body.recipe === "object") {
    updated = {
      ...recipe,
      ...body.recipe,
      id: recipe.id,
      slug: recipe.slug,
      reviewStatus: "fixed",
      reviewedAt: new Date().toISOString(),
      reviewNotes: notes ?? "Edición manual desde auditoría",
    };
  } else {
    return NextResponse.json({ message: "source inválido." }, { status: 400 });
  }

  recipes = updateRecipeById(recipes, recipe.id, updated);
  saveCocktails(recipes);

  return NextResponse.json({ recipe: updated, message: "Receta actualizada." });
}
