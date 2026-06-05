import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ensureUniqueBlogSlug } from "@/lib/blog/slug";
import { isAdminUser } from "@/lib/auth/admin-api";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const isAdmin = await isAdminUser(user.id);

    const posts = await prisma.blogPost.findMany({
      where: isAdmin ? undefined : { authorId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverUrl: true,
        published: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { email: true, name: true } },
      },
    });
    return NextResponse.json({ posts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al listar posts.";
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    const excerpt = String(body.excerpt ?? "").trim() || null;
    const coverUrl = body.coverUrl ? String(body.coverUrl) : null;
    const published = body.published !== false;

    if (!title || !content) {
      return NextResponse.json({ message: "Título y contenido son obligatorios." }, { status: 400 });
    }

    const slug = await ensureUniqueBlogSlug(prisma, title);
    const now = new Date();

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        coverUrl,
        authorId: user.id,
        published,
        publishedAt: published ? now : null,
        tags: [],
      },
    });

    return NextResponse.json({ post, message: "Artículo publicado correctamente." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear el post.";
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
