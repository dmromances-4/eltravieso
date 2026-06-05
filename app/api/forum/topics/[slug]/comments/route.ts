import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";

type RouteContext = { params: { slug: string } };

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const topic = await prisma.forumTopic.findUnique({ where: { slug: params.slug } });

    if (!topic || topic.status === "ARCHIVED" || topic.status === "CLOSED") {
      return NextResponse.json({ message: "Tema no encontrado o cerrado." }, { status: 404 });
    }

    const body = await request.json();
    const content = String(body.content ?? "").trim();

    if (!content) {
      return NextResponse.json({ message: "El comentario no puede estar vacío." }, { status: 400 });
    }

    const comment = await prisma.forumComment.create({
      data: {
        content,
        topicId: topic.id,
        authorId: user.id,
      },
      include: {
        author: { select: { name: true } },
      },
    });

    await prisma.forumTopic.update({
      where: { id: topic.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ comment, message: "Comentario publicado." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al publicar el comentario.";
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
