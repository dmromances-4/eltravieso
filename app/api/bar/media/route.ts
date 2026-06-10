import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ensureUniqueMediaSlug } from "@/lib/media/slug";
import { validateMediaForRole } from "@/lib/media/validate";
import type { CreateMediaInput } from "@/lib/media/types";
import prisma from "@/lib/prisma";

async function getBarProfileId(userId: string, role: string) {
  if (role === "ADMIN") return null;
  const bar = await prisma.barProfile.findUnique({ where: { userId }, select: { id: true } });
  return bar?.id ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "BAR_OWNER") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const barProfileId = await getBarProfileId(session.user.id, session.user.role);
  const items = await prisma.mediaItem.findMany({
    where: {
      kind: "EVENT_VIDEO",
      ...(session.user.role === "BAR_OWNER" && barProfileId ? { barProfileId } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "BAR_OWNER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const barProfileId = await getBarProfileId(session.user.id, session.user.role);
    if (session.user.role === "BAR_OWNER" && !barProfileId) {
      return NextResponse.json({ message: "Perfil de bar no encontrado." }, { status: 400 });
    }

    const body = (await request.json()) as CreateMediaInput;
    body.kind = "EVENT_VIDEO";
    body.barProfileId = barProfileId;
    body.status = session.user.role === "ADMIN" ? body.status ?? "PUBLISHED" : "PENDING";

    const error = validateMediaForRole(session.user.role, body);
    if (error) return NextResponse.json({ message: error }, { status: 400 });

    const slug = await ensureUniqueMediaSlug(prisma, body.title);
    const item = await prisma.mediaItem.create({
      data: {
        title: body.title.trim(),
        slug,
        kind: "EVENT_VIDEO",
        summary: body.summary ?? null,
        coverUrl: body.coverUrl ?? null,
        mediaUrl: body.mediaUrl ?? null,
        playbackUrl: body.playbackUrl ?? null,
        sourceType: body.sourceType ?? "EMBED",
        eventDate: body.eventDate ? new Date(body.eventDate) : null,
        cocktailSlugs: body.cocktailSlugs ?? [],
        tags: body.tags ?? [],
        status: body.status ?? "PENDING",
        publishedAt: body.status === "PUBLISHED" ? new Date() : null,
        barProfileId,
        createdById: session.user.id,
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
