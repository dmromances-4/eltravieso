import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { generateAndUploadRecipeCover } from "@/lib/recipes/generate-recipe-image";
import { parseStoredIngredients } from "@/lib/recipes/parse";

type RouteContext = { params: { id: string } };

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const recipe = await prisma.recipe.findUnique({ where: { id: params.id } });

    if (!recipe || recipe.authorId !== user.id) {
      return NextResponse.json({ message: "Receta no encontrada." }, { status: 404 });
    }

    const ingredients = parseStoredIngredients(recipe.ingredients);

    const imageUrl = await generateAndUploadRecipeCover(recipe.slug, {
      title: recipe.title,
      glass: recipe.glass ?? "Copa de autor",
      ingredients,
      method: recipe.method ?? undefined,
    });

    await prisma.recipe.update({
      where: { id: recipe.id },
      data: { imageUrl },
    });

    return NextResponse.json({ imageUrl, message: "Imagen regenerada." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al generar imagen.";
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
