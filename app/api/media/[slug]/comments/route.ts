import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getPublishedMediaBySlug } from "@/lib/media/catalog";
import { bumpCommentCount } from "@/lib/media/ratings";
import { validateCommentContent } from "@/lib/media/validate";
import prisma from "@/lib/prisma";

type RouteParams = { params: { slug: string } };

export async function GET(_request: Request, { params }: RouteParams) {
  const item = await getPublishedMediaBySlug(params.slug);
  if (!item) return NextResponse.json({ message: "No encontrado." }, { status: 404 });

  const comments = await prisma.mediaComment.findMany({
    where: { mediaItemId: item.id, parentId: null },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      author: { select: { id: true, name: true, imageUrl: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, imageUrl: true } } },
      },
    },
  });

  return NextResponse.json({ comments });
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireCurrentUser();
    const item = await getPublishedMediaBySlug(params.slug);
    if (!item) return NextResponse.json({ message: "No encontrado." }, { status: 404 });

    const body = await request.json();
    const content = String(body.content ?? "");
    const parentId = body.parentId ? String(body.parentId) : null;
    const contentError = validateCommentContent(content);
    if (contentError) {
      return NextResponse.json({ message: contentError }, { status: 400 });
    }

    const comment = await prisma.mediaComment.create({
      data: { mediaItemId: item.id, authorId: user.id, content: content.trim(), parentId },
      include: { author: { select: { id: true, name: true, imageUrl: true } } },
    });
    await bumpCommentCount(item.id, 1);

    return NextResponse.json({ comment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
