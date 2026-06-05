import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ensureUniqueForumSlug } from "@/lib/forum/slug";

export async function GET() {
  try {
    const topics = await prisma.forumTopic.findMany({
      where: { status: { in: ["OPEN", "PINNED"] } },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      include: {
        author: { select: { name: true, imageUrl: true } },
        _count: { select: { comments: true } },
      },
      take: 50,
    });

    return NextResponse.json({ topics });
  } catch (error) {
    console.error("[FORUM_TOPICS_GET]", error);
    return NextResponse.json({ message: "Error al cargar temas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();

    if (!title || !content) {
      return NextResponse.json({ message: "Título y contenido son obligatorios." }, { status: 400 });
    }

    if (title.length > 200) {
      return NextResponse.json({ message: "El título es demasiado largo." }, { status: 400 });
    }

    const slug = await ensureUniqueForumSlug(prisma, title);

    const topic = await prisma.forumTopic.create({
      data: {
        title,
        slug,
        content,
        authorId: user.id,
        status: "OPEN",
      },
      select: { id: true, slug: true, title: true },
    });

    return NextResponse.json({ topic, message: "Tema publicado." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear el tema.";
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
