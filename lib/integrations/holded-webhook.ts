import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";
import {
  resolveHoldedApiKey,
  upsertHoldedProduct,
  type HoldedProductPayload,
} from "@/lib/integrations/holded-catalog";
import { pushStockToHolded } from "@/lib/integrations/holded-stock-push";

export type HoldedWebhookEvent =
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "stock.updated";

export function verifyHoldedWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) return false;

  const expectedHex = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBase64 = createHmac("sha256", secret).update(rawBody).digest("base64");

  return timingSafeCompare(signature, expectedHex) || timingSafeCompare(signature, expectedBase64);
}

function timingSafeCompare(a: string, b: string): boolean {
  try {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export function resolveHoldedWebhookSecret(barWebhookToken?: string | null) {
  const envSecret = process.env.HOLDED_WEBHOOK_SECRET?.trim();
  if (envSecret) return envSecret;
  return barWebhookToken?.trim() || "";
}

export function ensureHoldedWebhookToken(existing?: string | null) {
  return existing?.trim() || randomUUID();
}

function normalizeProductPayload(body: Record<string, unknown>): HoldedProductPayload | null {
  const raw = (body.product ?? body.data ?? body) as Record<string, unknown>;
  const id = String(raw.id ?? raw.productId ?? "").trim();
  const name = String(raw.name ?? raw.title ?? "").trim();

  if (!id && !name) return null;

  return {
    id: id || `holded-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name: name || `Producto ${id}`,
    desc: raw.desc != null ? String(raw.desc) : raw.description != null ? String(raw.description) : undefined,
    price: raw.price != null ? Number(raw.price) : undefined,
    stock: raw.stock != null ? Number(raw.stock) : raw.quantity != null ? Number(raw.quantity) : undefined,
    sku: raw.sku != null ? String(raw.sku) : undefined,
    code: raw.code != null ? String(raw.code) : undefined,
  };
}

export function parseHoldedWebhookEvent(body: Record<string, unknown>): {
  event: HoldedWebhookEvent;
  product: HoldedProductPayload | null;
} {
  const eventRaw = String(body.event ?? body.type ?? body.action ?? "product.updated").toLowerCase();

  let event: HoldedWebhookEvent = "product.updated";
  if (eventRaw.includes("delete") || eventRaw.includes("removed")) {
    event = "product.deleted";
  } else if (eventRaw.includes("create")) {
    event = "product.created";
  } else if (eventRaw.includes("stock")) {
    event = "stock.updated";
  }

  return { event, product: normalizeProductPayload(body) };
}

export async function findBarProfileForHoldedWebhook(barToken?: string | null) {
  const token = barToken?.trim();
  if (!token) {
    return null;
  }

  return prisma.barProfile.findFirst({
    where: { holdedWebhookToken: token },
  });
}

async function findLocalVariantByHoldedId(holdedProductId: string) {
  const product = await prisma.product.findFirst({
    where: {
      metadata: { path: ["holdedProductId"], equals: holdedProductId },
    },
    include: { variants: { take: 1 } },
  });

  if (!product?.variants[0]) return null;
  return { product, variant: product.variants[0] };
}

export async function handleHoldedInboundEvent(
  barProfileId: string,
  event: HoldedWebhookEvent,
  product: HoldedProductPayload | null,
) {
  if (!product) {
    throw new Error("Payload de producto Holded inválido.");
  }

  if (event === "product.deleted") {
    const local = await findLocalVariantByHoldedId(product.id);
    if (!local) return { action: "ignored", reason: "product_not_linked" };

    await prisma.productVariant.update({
      where: { id: local.variant.id },
      data: { stock: 0 },
    });
    await prisma.barStock.updateMany({
      where: { barProfileId, variantId: local.variant.id },
      data: { currentUnits: 0, lastSyncedAt: new Date() },
    });

    return { action: "deleted", variantId: local.variant.id };
  }

  if (event === "stock.updated" && product.stock == null) {
    throw new Error("stock.updated requiere campo stock o quantity.");
  }

  const result = await upsertHoldedProduct(barProfileId, product);

  if (event === "stock.updated") {
    return { action: "stock_synced", ...result };
  }

  return { action: event === "product.created" ? "created" : "updated", ...result };
}

export async function pushLocalStockToHolded(
  barProfileId: string,
  variantId: string,
  currentUnits: number,
) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });

  if (!variant) return { pushed: false, reason: "variant_not_found" };

  const meta = variant.product.metadata as { holdedProductId?: string } | null;
  const holdedProductId = meta?.holdedProductId;
  if (!holdedProductId) return { pushed: false, reason: "not_linked_to_holded" };

  const profile = await prisma.barProfile.findUnique({
    where: { id: barProfileId },
    select: { holdedApiKey: true },
  });

  if (!resolveHoldedApiKey(profile?.holdedApiKey)) {
    return { pushed: false, reason: "holded_not_configured" };
  }

  await pushStockToHolded(holdedProductId, currentUnits, profile?.holdedApiKey);
  return { pushed: true, holdedProductId, stock: currentUnits };
}
