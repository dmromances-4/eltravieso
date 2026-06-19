import { NextResponse } from "next/server";
import { logServerError } from '@/lib/security/safe-error';
import prisma from "@/lib/prisma";

type RouteContext = { params: { slug: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const topic = await prisma.forumTopic.findUnique({
      where: { slug: params.slug },
      include: {
        author: { select: { name: true, imageUrl: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { name: true, imageUrl: true } },
          },
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ message: "Tema no encontrado." }, { status: 404 });
    }

    await prisma.forumTopic.update({
      where: { id: topic.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ topic });
  } catch (error) {
    logServerError('forum-topic', error);
    return NextResponse.json({ message: "Error al cargar el tema." }, { status: 500 });
  }
}
