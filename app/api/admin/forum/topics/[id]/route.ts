import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";
import type { ForumTopicStatus } from "@prisma/client";

type RouteContext = { params: { id: string } };

const VALID_STATUSES: ForumTopicStatus[] = ["OPEN", "CLOSED", "PINNED", "ARCHIVED"];

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await requireAdminUser();
    const body = await request.json();

    const data: { status?: ForumTopicStatus; isPinned?: boolean } = {};

    if (body.status != null) {
      const status = String(body.status).toUpperCase() as ForumTopicStatus;
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ message: "Estado no válido." }, { status: 400 });
      }
      data.status = status;
      if (status === "PINNED") data.isPinned = true;
      if (status === "OPEN" && body.isPinned === false) data.isPinned = false;
      if (status === "CLOSED" || status === "ARCHIVED") data.isPinned = false;
    }

    if (body.isPinned != null && data.isPinned === undefined) {
      data.isPinned = Boolean(body.isPinned);
      if (data.isPinned && !data.status) {
        data.status = "PINNED";
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: "Nada que actualizar." }, { status: 400 });
    }

    const topic = await prisma.forumTopic.update({
      where: { id: params.id },
      data,
      select: { id: true, slug: true, title: true, status: true, isPinned: true },
    });

    return NextResponse.json({ topic, message: "Tema actualizado." });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
