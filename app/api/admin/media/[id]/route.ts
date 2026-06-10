import { NextResponse } from "next/server";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";
import { validateMediaInput } from "@/lib/media/validate";
import type { CreateMediaInput } from "@/lib/media/types";
import prisma from "@/lib/prisma";

type RouteParams = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireAdminUser();
    const item = await prisma.mediaItem.findUnique({
      where: { id: params.id },
      include: { episodes: true, podcastFeed: true, parent: true },
    });
    if (!item) return NextResponse.json({ message: "No encontrado." }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireAdminUser();
    const body = (await request.json()) as Partial<CreateMediaInput>;
    const existing = await prisma.mediaItem.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ message: "No encontrado." }, { status: 404 });

    const merged: CreateMediaInput = {
      title: body.title ?? existing.title,
      kind: body.kind ?? existing.kind,
      summary: body.summary ?? existing.summary,
      coverUrl: body.coverUrl ?? existing.coverUrl,
      mediaUrl: body.mediaUrl ?? existing.mediaUrl,
      playbackUrl: body.playbackUrl ?? existing.playbackUrl,
      sourceType: body.sourceType ?? existing.sourceType,
      parentId: body.parentId ?? existing.parentId,
      seasonNumber: body.seasonNumber ?? existing.seasonNumber,
      episodeNumber: body.episodeNumber ?? existing.episodeNumber,
      eventDate: body.eventDate ?? existing.eventDate?.toISOString() ?? null,
      cocktailSlugs: body.cocktailSlugs ?? existing.cocktailSlugs,
      tags: body.tags ?? existing.tags,
      status: body.status ?? existing.status,
    };
    const error = validateMediaInput(merged);
    if (error) return NextResponse.json({ message: error }, { status: 400 });

    const publish = merged.status === "PUBLISHED";
    const item = await prisma.mediaItem.update({
      where: { id: params.id },
      data: {
        title: merged.title.trim(),
        summary: merged.summary ?? null,
        coverUrl: merged.coverUrl ?? null,
        mediaUrl: merged.mediaUrl ?? null,
        playbackUrl: merged.playbackUrl ?? null,
        sourceType: merged.sourceType ?? "EMBED",
        cocktailSlugs: merged.cocktailSlugs ?? [],
        tags: merged.tags ?? [],
        status: merged.status ?? "DRAFT",
        publishedAt: publish ? existing.publishedAt ?? new Date() : null,
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireAdminUser();
    await prisma.mediaItem.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Eliminado." });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
