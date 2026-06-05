import { NextResponse } from "next/server";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";
import { runCampaignSend } from "@/lib/marketing/send-campaign";

type RouteParams = { params: { id: string } };

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const admin = await requireAdminUser();
    const result = await runCampaignSend(params.id, { previewUserId: admin.id });
    return NextResponse.json({ message: "Preview enviado al admin.", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error enviando preview";
    if (message.includes("no encontrada")) {
      return NextResponse.json({ message }, { status: 404 });
    }
    return adminApiErrorResponse(error);
  }
}
