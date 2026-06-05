import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { BarOnlineSessionType } from "@prisma/client";
import { isActiveVip, vipMaxRoomUsers, freeMaxRoomUsers } from "@/lib/membership/entitlements";
import { resolveMaxUsersForHost } from "@/lib/realtime/room-access";

const VALID_TYPES: BarOnlineSessionType[] = ["CHAT", "VIDEO_CALL", "TASTING_EVENT"];

export async function GET() {
  try {
    const sessions = await prisma.barOnlineSession.findMany({
      where: { isActive: true, isPrivate: false },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
      include: {
        host: { select: { id: true, name: true } },
        _count: { select: { participants: true } },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("[BAR_ONLINE_GET_ERROR]:", error);
    return NextResponse.json(
      { message: error.message || "Error al obtener las sesiones." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, type, maxUsers, scheduledAt, isPrivate, hdEnabled } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { message: "El título de la sesión es obligatorio." },
        { status: 400 }
      );
    }

    const host = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { membershipStatus: true, membershipExpiresAt: true },
    });

    const hostIsVip = host ? isActiveVip(host) : false;
    const wantsPrivate = Boolean(isPrivate);

    if (wantsPrivate && !hostIsVip) {
      return NextResponse.json(
        { message: "Las salas privadas requieren membresía VIP del Club de la Trastienda." },
        { status: 403 }
      );
    }

    const sessionType: BarOnlineSessionType = VALID_TYPES.includes(type)
      ? type
      : "CHAT";

    const resolvedMax = resolveMaxUsersForHost(hostIsVip, maxUsers ? Number(maxUsers) : undefined);

    const created = await prisma.barOnlineSession.create({
      data: {
        title,
        description: description || null,
        type: sessionType,
        hostId: session.user.id,
        maxUsers: resolvedMax,
        isPrivate: wantsPrivate,
        hdEnabled: hostIsVip && Boolean(hdEnabled),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        roomId: randomUUID(),
        isActive: true,
        participants: { connect: { id: session.user.id } },
      },
      include: {
        host: { select: { id: true, name: true } },
        _count: { select: { participants: true } },
      },
    });

    return NextResponse.json(
      {
        session: created,
        limits: { maxUsers: resolvedMax, isVip: hostIsVip, freeCap: freeMaxRoomUsers(), vipCap: vipMaxRoomUsers() },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[BAR_ONLINE_POST_ERROR]:", error);
    return NextResponse.json(
      { message: error.message || "Error al crear la sesión." },
      { status: 500 }
    );
  }
}
