import { NextResponse } from "next/server";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";
import { ensureUniqueMediaSlug } from "@/lib/media/slug";
import { validateMediaInput } from "@/lib/media/validate";
import type { CreateMediaInput } from "@/lib/media/types";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const kind = searchParams.get("kind") ?? undefined;

    const items = await prisma.mediaItem.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(kind ? { kind: kind as never } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        barProfile: { select: { businessName: true } },
        createdBy: { select: { email: true, name: true } },
        _count: { select: { episodes: true } },
      },
    });
    return NextResponse.json({ items });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json()) as CreateMediaInput;
    const error = validateMediaInput(body);
    if (error) return NextResponse.json({ message: error }, { status: 400 });

    const slug = await ensureUniqueMediaSlug(prisma, body.title);
    const publish = body.status === "PUBLISHED";

    const item = await prisma.mediaItem.create({
      data: {
        title: body.title.trim(),
        slug,
        kind: body.kind,
        summary: body.summary ?? null,
        coverUrl: body.coverUrl ?? null,
        mediaUrl: body.mediaUrl ?? null,
        playbackUrl: body.playbackUrl ?? null,
        sourceType: body.sourceType ?? "EMBED",
        parentId: body.parentId ?? null,
        seasonNumber: body.seasonNumber ?? null,
        episodeNumber: body.episodeNumber ?? null,
        eventDate: body.eventDate ? new Date(body.eventDate) : null,
        cocktailSlugs: body.cocktailSlugs ?? [],
        tags: body.tags ?? [],
        status: body.status ?? "DRAFT",
        publishedAt: publish ? new Date() : null,
        createdById: admin.id,
        tmdbId: body.tmdbId ?? null,
        tmdbType: body.tmdbType ?? null,
        imdbId: body.imdbId ?? null,
        releaseYear: body.releaseYear ?? null,
        runtimeMins: body.runtimeMins ?? null,
        metadata: body.metadata ?? undefined,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
