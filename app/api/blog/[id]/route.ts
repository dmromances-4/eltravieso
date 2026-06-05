import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ensureUniqueBlogSlug } from "@/lib/blog/slug";
import { canManageBlogPost } from "@/lib/blog/access";

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const existing = await prisma.blogPost.findUnique({ where: { id: params.id } });

    if (!existing || !(await canManageBlogPost(user.id, existing.authorId))) {
      return NextResponse.json({ message: "Post no encontrado." }, { status: 404 });
    }

    const body = await request.json();
    const title = body.title != null ? String(body.title).trim() : existing.title;
    const content = body.content != null ? String(body.content).trim() : existing.content;
    const excerpt = body.excerpt != null ? String(body.excerpt).trim() || null : existing.excerpt;
    const coverUrl = body.coverUrl != null ? (body.coverUrl ? String(body.coverUrl) : null) : existing.coverUrl;
    const published = body.published != null ? Boolean(body.published) : existing.published;

    const slug =
      title !== existing.title ? await ensureUniqueBlogSlug(prisma, title) : existing.slug;

    const post = await prisma.blogPost.update({
      where: { id: params.id },
      data: {
        title,
        slug,
        content,
        excerpt,
        coverUrl,
        published,
        publishedAt: published && !existing.publishedAt ? new Date() : existing.publishedAt,
      },
    });

    return NextResponse.json({ post, message: "Artículo actualizado." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar el post.";
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const existing = await prisma.blogPost.findUnique({ where: { id: params.id } });

    if (!existing || !(await canManageBlogPost(user.id, existing.authorId))) {
      return NextResponse.json({ message: "Post no encontrado." }, { status: 404 });
    }

    await prisma.blogPost.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Artículo eliminado." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar el post.";
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
