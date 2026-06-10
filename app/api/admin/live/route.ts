import { NextResponse } from "next/server";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";
import { ensureUniqueMediaSlug } from "@/lib/media/slug";
import { validateLiveStreamInput } from "@/lib/media/validate";
import type { CreateLiveStreamInput } from "@/lib/media/types";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdminUser();
    const streams = await prisma.liveStream.findMany({ orderBy: { updatedAt: "desc" } });
    return NextResponse.json({ streams });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = (await request.json()) as CreateLiveStreamInput;
    const error = validateLiveStreamInput(body);
    if (error) return NextResponse.json({ message: error }, { status: 400 });

    const slug = await ensureUniqueMediaSlug(prisma, body.title, "liveStream");
    const stream = await prisma.liveStream.create({
      data: {
        title: body.title.trim(),
        slug,
        category: body.category ?? "OTHER",
        embedUrl: body.embedUrl.trim(),
        backupEmbedUrl: body.backupEmbedUrl ?? null,
        isLive: body.isLive ?? true,
        scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : null,
        scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : null,
        coverUrl: body.coverUrl ?? null,
        summary: body.summary ?? null,
        status: body.status ?? "DRAFT",
        sourceLabel: body.sourceLabel ?? null,
        curatedById: admin.id,
      },
    });
    return NextResponse.json({ stream });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
