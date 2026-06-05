import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";
import { serializeCampaign } from "@/lib/marketing/types";

type RouteParams = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireAdminUser();
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!campaign) {
      return NextResponse.json({ message: "Campaña no encontrada" }, { status: 404 });
    }
    return NextResponse.json({
      campaign: serializeCampaign(campaign),
      messages: campaign.messages,
    });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireAdminUser();
    const body = await request.json();

    const existing = await prisma.campaign.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ message: "Campaña no encontrada" }, { status: 404 });
    }
    if (existing.status !== "DRAFT") {
      return NextResponse.json({ message: "Solo se pueden editar borradores" }, { status: 400 });
    }

    const campaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        ...(body.name != null ? { name: String(body.name).trim() } : {}),
        ...(body.channel != null ? { channel: String(body.channel).toUpperCase() as never } : {}),
        ...(body.subject !== undefined ? { subject: body.subject ? String(body.subject) : null } : {}),
        ...(body.bodyHtml !== undefined ? { bodyHtml: body.bodyHtml ? String(body.bodyHtml) : null } : {}),
        ...(body.bodyText != null ? { bodyText: String(body.bodyText) } : {}),
        ...(body.audience != null ? { audience: body.audience } : {}),
      },
      include: { _count: { select: { messages: true } } },
    });

    return NextResponse.json({ campaign: serializeCampaign(campaign) });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
