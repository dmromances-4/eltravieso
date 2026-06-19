import { NextResponse } from "next/server";
import {
  findBarProfileForHoldedWebhook,
  handleHoldedInboundEvent,
  parseHoldedWebhookEvent,
  resolveHoldedWebhookSecret,
  verifyHoldedWebhookSignature,
} from "@/lib/integrations/holded-webhook";
import { auditEvent } from "@/lib/observability/audit";
import { buildRequestContext, runWithRequestContext } from "@/lib/observability/request-context";
import { buildWebhookDedupeId } from "@/lib/observability/webhook-dedupe";
import { isWebhookProcessed, markWebhookProcessed } from "@/lib/observability/webhook-idempotency";
import { logServerError } from "@/lib/security/safe-error";

export async function POST(request: Request) {
  return runWithRequestContext(buildRequestContext(request), async () => {
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

    const eventId = buildWebhookDedupeId("holded", rawBody, profile.id);
    if (await isWebhookProcessed(eventId)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    try {
      const { event, product } = parseHoldedWebhookEvent(body);

      void auditEvent({
        action: "webhook.holded.received",
        request,
        resourceType: "BarProfile",
        resourceId: profile.id,
        metadata: { event, productId: product?.id },
      });

      const result = await handleHoldedInboundEvent(profile.id, event, product);
      await markWebhookProcessed(eventId, "holded");
      await prismaSafeUpdateSyncStatus(profile.id);

      return NextResponse.json({ ok: true, event, result });
    } catch (error) {
      logServerError("holded-webhook", error, { path: new URL(request.url).pathname });
      const message = error instanceof Error ? error.message : "Error procesando webhook Holded";
      return NextResponse.json({ message }, { status: 500 });
    }
  });
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
