import { NextResponse } from "next/server";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";
import { ensureUniqueMediaSlug } from "@/lib/media/slug";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdminUser();
    const feeds = await prisma.podcastFeed.findMany({
      orderBy: { updatedAt: "desc" },
      include: { show: { select: { title: true, slug: true, status: true } } },
    });
    return NextResponse.json({ feeds });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const rssUrl = String(body.rssUrl ?? "").trim();
    if (!title || !rssUrl) {
      return NextResponse.json({ message: "Título y RSS URL son obligatorios." }, { status: 400 });
    }

    const slug = await ensureUniqueMediaSlug(prisma, title);
    const show = await prisma.mediaItem.create({
      data: {
        title,
        slug,
        kind: "PODCAST_SHOW",
        summary: body.summary ? String(body.summary) : null,
        coverUrl: body.coverUrl ? String(body.coverUrl) : null,
        sourceType: "EMBED",
        status: body.publish ? "PUBLISHED" : "DRAFT",
        publishedAt: body.publish ? new Date() : null,
        createdById: admin.id,
      },
    });

    const feed = await prisma.podcastFeed.create({
      data: {
        title,
        rssUrl,
        mediaItemId: show.id,
        coverUrl: body.coverUrl ? String(body.coverUrl) : null,
      },
    });

    return NextResponse.json({ show, feed });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
