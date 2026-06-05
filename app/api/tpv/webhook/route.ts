import { NextResponse } from "next/server";
import { handleTpvStockWebhook } from "@/lib/wholesale/reposition";
import prisma from "@/lib/prisma";
import { verifyTpvSignature } from "@/lib/tpv/verify-signature";
import { logServerError } from "@/lib/security/safe-error";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-tpv-signature");
    const provider = req.headers.get("x-tpv-provider")?.toLowerCase();
    const tpvToken = req.headers.get("x-tpv-token") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    const rawBody = await req.text();
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (!provider || !signature) {
      return NextResponse.json(
        { error: "Missing TPV identification headers" },
        { status: 400 },
      );
    }

    const tokenFromBody =
      typeof body.tpv_token === "string"
        ? body.tpv_token
        : typeof body.token === "string"
          ? body.token
          : null;

    const resolvedToken = tpvToken || tokenFromBody;

    if (!resolvedToken) {
      return NextResponse.json(
        { error: "Missing TPV token (x-tpv-token header or body.tpv_token)" },
        { status: 400 },
      );
    }

    const barProfile = await prisma.barProfile.findFirst({
      where: {
        tpvProvider: provider,
        tpvToken: resolvedToken,
      },
    });

    if (!barProfile) {
      return NextResponse.json(
        { error: "No bar configuration matches this TPV provider and token" },
        { status: 404 },
      );
    }

    if (!verifyTpvSignature(rawBody, signature, resolvedToken)) {
      return NextResponse.json({ error: "Invalid TPV signature" }, { status: 401 });
    }

    let sku = "";
    let unitsSold = 0;

    switch (provider) {
      case "revo":
        sku = String(body.sku ?? "");
        unitsSold = Number(body.qty ?? 0);
        break;

      case "lightspeed": {
        const item = body.item as { sku?: string } | undefined;
        sku = item?.sku ?? "";
        unitsSold = Number(body.quantity_sold ?? 0);
        break;
      }

      case "square": {
        const data = body.data as { object?: { line_items?: Array<{ catalog_object_id?: string; quantity?: string }> } } | undefined;
        const item = data?.object?.line_items?.[0];
        sku = item?.catalog_object_id ?? "";
        unitsSold = Number(item?.quantity ?? 0);
        break;
      }

      default:
        return NextResponse.json(
          { error: `Provider ${provider} not supported` },
          { status: 400 },
        );
    }

    if (!sku || unitsSold <= 0) {
      return NextResponse.json(
        { error: "Invalid sku or quantities sold parsed from payload" },
        { status: 400 },
      );
    }

    const telemetryResult = await handleTpvStockWebhook(
      barProfile.id,
      sku,
      unitsSold,
      provider,
    );

    return NextResponse.json({
      success: true,
      provider,
      barProfileId: barProfile.id,
      sku,
      unitsSold,
      currentStock: telemetryResult.updatedUnits,
      replenishment: {
        triggered: telemetryResult.triggered,
        reason: telemetryResult.reason,
        orderId: telemetryResult.orderId,
        orderNumber: telemetryResult.orderNumber,
      },
    });
  } catch (error) {
    logServerError("tpv-webhook", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
