import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";
import { slugify } from "@/lib/utils/slug";

type RouteContext = { params: { id: string } };

async function ensureUniqueRecipeSlug(baseSlug: string, excludeId: string) {
  let slug = baseSlug;
  let index = 1;
  for (;;) {
    const existing = await prisma.recipe.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = `${baseSlug}-${index}`;
    index += 1;
  }
  return slug;
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireAdminUser();

    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      include: { author: { select: { email: true, name: true } } },
    });

    if (!recipe) {
      return NextResponse.json({ message: "Receta no encontrada." }, { status: 404 });
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await requireAdminUser();

    const existing = await prisma.recipe.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ message: "Receta no encontrada." }, { status: 404 });
    }

    const body = await request.json();
    const title = body.title != null ? String(body.title).trim() : existing.title;
    const ingredients = body.ingredients != null ? String(body.ingredients).trim() : existing.ingredients;
    const method = body.method != null ? String(body.method).trim() || null : existing.method;
    const glass = body.glass != null ? String(body.glass).trim() || null : existing.glass;
    const summary = body.summary != null ? String(body.summary).trim() || null : existing.summary;
    const imageUrl = body.imageUrl != null ? (body.imageUrl ? String(body.imageUrl) : null) : existing.imageUrl;
    const isPublished = body.isPublished != null ? Boolean(body.isPublished) : existing.isPublished;
    const isPremium = body.isPremium != null ? Boolean(body.isPremium) : existing.isPremium;

    const slug =
      title !== existing.title
        ? await ensureUniqueRecipeSlug(slugify(title), params.id)
        : existing.slug;

    const recipe = await prisma.recipe.update({
      where: { id: params.id },
      data: { title, slug, ingredients, method, glass, summary, imageUrl, isPublished, isPremium },
    });

    return NextResponse.json({ recipe, message: "Receta actualizada." });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await requireAdminUser();

    const existing = await prisma.recipe.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ message: "Receta no encontrada." }, { status: 404 });
    }

    await prisma.recipe.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Receta eliminada." });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
