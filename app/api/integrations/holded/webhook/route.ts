import { NextResponse } from "next/server";
import {
  findBarProfileForHoldedWebhook,
  handleHoldedInboundEvent,
  parseHoldedWebhookEvent,
  resolveHoldedWebhookSecret,
  verifyHoldedWebhookSignature,
} from "@/lib/integrations/holded-webhook";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-holded-signature") ??
    request.headers.get("x-webhook-signature");
  const barToken =
    request.headers.get("x-holded-bar-token") ??
    request.headers.get("x-bar-token");

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
  }

  const resolvedBarToken =
    barToken ?? (typeof body.barToken === "string" ? body.barToken : null);

  if (!resolvedBarToken?.trim()) {
    return NextResponse.json(
      { message: "Falta x-holded-bar-token o body.barToken" },
      { status: 400 },
    );
  }

  const profile = await findBarProfileForHoldedWebhook(resolvedBarToken);

  if (!profile) {
    return NextResponse.json({ message: "Bar Holded no encontrado." }, { status: 404 });
  }

  const secret = resolveHoldedWebhookSecret(profile.holdedWebhookToken ?? null);
  if (!secret) {
    return NextResponse.json({ message: "Webhook Holded no configurado." }, { status: 503 });
  }

  if (!verifyHoldedWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  try {
    const { event, product } = parseHoldedWebhookEvent(body);
    const result = await handleHoldedInboundEvent(profile.id, event, product);

    await prismaSafeUpdateSyncStatus(profile.id);

    return NextResponse.json({ ok: true, event, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error procesando webhook Holded";
    console.error("[HOLDED_WEBHOOK]", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}

async function prismaSafeUpdateSyncStatus(barProfileId: string) {
  const { default: prisma } = await import("@/lib/prisma");
  await prisma.barProfile.update({
    where: { id: barProfileId },
    data: {
      holdedSyncStatus: "ok",
      holdedLastSyncAt: new Date(),
      holdedSyncError: null,
    },
  });
}
