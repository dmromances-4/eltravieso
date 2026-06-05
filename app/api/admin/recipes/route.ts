import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";
import { slugify } from "@/lib/utils/slug";

async function ensureUniqueRecipeSlug(baseSlug: string) {
  let slug = baseSlug;
  let index = 1;
  while (await prisma.recipe.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }
  return slug;
}

export async function GET() {
  try {
    await requireAdminUser();

    const recipes = await prisma.recipe.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        author: { select: { email: true, name: true } },
      },
    });

    return NextResponse.json({ recipes });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const ingredients = String(body.ingredients ?? "").trim();
    const method = String(body.method ?? "").trim() || null;
    const glass = String(body.glass ?? "").trim() || null;
    const summary = String(body.summary ?? "").trim() || null;
    const imageUrl = body.imageUrl ? String(body.imageUrl) : null;
    const isPremium = body.isPremium === true;

    if (!title || !ingredients) {
      return NextResponse.json({ message: "Título e ingredientes son obligatorios." }, { status: 400 });
    }

    const slug = await ensureUniqueRecipeSlug(slugify(title) || `receta-${Date.now()}`);

    const recipe = await prisma.recipe.create({
      data: {
        title,
        slug,
        ingredients,
        method,
        glass,
        summary,
        imageUrl,
        authorId: admin.id,
        isPublished: true,
        isPremium,
        tags: [],
      },
    });

    return NextResponse.json({ recipe, message: "Receta creada." });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
