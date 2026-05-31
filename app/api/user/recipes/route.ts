import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { parseStoredIngredients } from "@/lib/recipes/parse";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const recipes = await prisma.recipe.findMany({
    where: { authorId: session.user.id },
    include: { technical: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    recipes: recipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      slug: recipe.slug,
      summary: recipe.summary,
      ingredients: parseStoredIngredients(recipe.ingredients),
      method: recipe.method,
      abv: recipe.technical?.abv ?? null,
      createdAt: recipe.createdAt,
      href: `/recetas/${recipe.slug}`,
    })),
  });
}
