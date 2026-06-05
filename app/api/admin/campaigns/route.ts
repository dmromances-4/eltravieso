import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";
import { serializeCampaign, validateCreateCampaignInput } from "@/lib/marketing/types";

export async function GET() {
  try {
    await requireAdminUser();
    const campaigns = await prisma.campaign.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { messages: true } } },
    });
    return NextResponse.json({ campaigns: campaigns.map(serializeCampaign) });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const parsed = validateCreateCampaignInput(body);
    if (typeof parsed === "string") {
      return NextResponse.json({ message: parsed }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: parsed.name,
        channel: parsed.channel,
        subject: parsed.subject,
        bodyHtml: parsed.bodyHtml,
        bodyText: parsed.bodyText,
        audience: parsed.audience ?? {},
        createdById: admin.id,
      },
      include: { _count: { select: { messages: true } } },
    });

    return NextResponse.json({ campaign: serializeCampaign(campaign), message: "Campaña creada." });
  } catch (error) {
    return adminApiErrorResponse(error);
  }
}
