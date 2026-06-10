import { NextResponse } from "next/server";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";
import prisma from "@/lib/prisma";

type RouteParams = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireAdminUser();
    const body = await request.json();
    const status = String(body.status ?? "") as "PUBLISHED" | "DRAFT" | "ARCHIVED" | "PENDING";
    if (!["PUBLISHED", "DRAFT", "ARCHIVED", "PENDING"].includes(status)) {
      return NextResponse.json({ message: "Estado inválido." }, { status: 400 });
    }

    const item = await prisma.mediaItem.update({
      where: { id: params.id },
      data: {
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
