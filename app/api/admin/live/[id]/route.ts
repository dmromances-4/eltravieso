import { NextResponse } from "next/server";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";
import { validateLiveStreamInput } from "@/lib/media/validate";
import type { CreateLiveStreamInput } from "@/lib/media/types";
import { checkLiveEmbedUrl } from "@/lib/media/upload";
import prisma from "@/lib/prisma";

type RouteParams = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireAdminUser();
    const body = (await request.json()) as Partial<CreateLiveStreamInput>;
    const existing = await prisma.liveStream.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ message: "No encontrado." }, { status: 404 });

    const merged: CreateLiveStreamInput = {
      title: body.title ?? existing.title,
      category: body.category ?? existing.category,
      embedUrl: body.embedUrl ?? existing.embedUrl,
      backupEmbedUrl: body.backupEmbedUrl ?? existing.backupEmbedUrl,
      isLive: body.isLive ?? existing.isLive,
      scheduledStart: body.scheduledStart ?? existing.scheduledStart?.toISOString() ?? null,
      scheduledEnd: body.scheduledEnd ?? existing.scheduledEnd?.toISOString() ?? null,
      coverUrl: body.coverUrl ?? existing.coverUrl,
      summary: body.summary ?? existing.summary,
      status: body.status ?? existing.status,
      sourceLabel: body.sourceLabel ?? existing.sourceLabel,
    };
    const error = validateLiveStreamInput(merged);
    if (error) return NextResponse.json({ message: error }, { status: 400 });

    const stream = await prisma.liveStream.update({
      where: { id: params.id },
      data: {
        title: merged.title.trim(),
        category: merged.category ?? "OTHER",
        embedUrl: merged.embedUrl.trim(),
        backupEmbedUrl: merged.backupEmbedUrl ?? null,
        isLive: merged.isLive ?? true,
        coverUrl: merged.coverUrl ?? null,
        summary: merged.summary ?? null,
        status: merged.status ?? "DRAFT",
        sourceLabel: merged.sourceLabel ?? null,
      },
    });
    return NextResponse.json({ stream });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireAdminUser();
    await prisma.liveStream.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Eliminado." });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    await requireAdminUser();
    const stream = await prisma.liveStream.findUnique({ where: { id: params.id } });
    if (!stream) return NextResponse.json({ message: "No encontrado." }, { status: 404 });
    const ok = await checkLiveEmbedUrl(stream.embedUrl);
    const updated = await prisma.liveStream.update({
      where: { id: params.id },
      data: { lastCheckedAt: new Date(), lastCheckOk: ok },
    });
    return NextResponse.json({ stream: updated, ok });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
