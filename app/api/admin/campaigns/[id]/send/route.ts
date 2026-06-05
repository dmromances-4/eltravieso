import { NextResponse } from "next/server";
import { requireAdminUser, adminApiErrorResponse } from "@/lib/auth/admin-api";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { runCampaignSend } from "@/lib/marketing/send-campaign";

type RouteParams = { params: { id: string } };

export async function POST(request: Request, { params }: RouteParams) {
  const limited = await enforceRateLimit(request, "campaign-send", RATE_LIMITS.campaignSend);
  if (limited) {
    return NextResponse.json({ message: limited.message }, { status: limited.status, headers: limited.headers });
  }

  try {
    await requireAdminUser();
    const result = await runCampaignSend(params.id);
    return NextResponse.json({ message: "Campaña enviada.", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error enviando campaña";
    if (message.includes("no encontrada")) {
      return NextResponse.json({ message }, { status: 404 });
    }
    return adminApiErrorResponse(error);
  }
}
