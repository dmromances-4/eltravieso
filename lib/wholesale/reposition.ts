// ─────────────────────────────────────────────────────────────────────────────
// Stock Telemetry & Automatic Replenishment Engine (TPV Integration)
// Monitors BarStock levels and triggers WholesaleOrders based on thresholds.
// ─────────────────────────────────────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { resolveVariantByTpvIdentifier } from "@/lib/integrations/resolve-variant";
import { dispatchWholesaleOrder } from "./fifo-dispatch";

export interface RepositionTriggerResult {
  triggered: boolean;
  reason: string;
  orderId?: string;
  orderNumber?: string;
}

/**
 * Evaluates stock for a specific bar and product variant.
 * If stock <= threshold and auto-reorder is enabled, triggers an automatic B2B order.
 */
export async function evaluateAndTriggerReposition(
  barProfileId: string,
  variantId: string
): Promise<RepositionTriggerResult> {
  // 1. Fetch Bar Profile and specific stock details
  const barProfile = await prisma.barProfile.findUnique({
    where: { id: barProfileId },
    include: {
      stockEntries: {
        where: { variantId },
      },
    },
  });

  if (!barProfile) {
    return { triggered: false, reason: `Bar profile ${barProfileId} not found.` };
  }

  if (!barProfile.autoReorderEnabled) {
    return { triggered: false, reason: "Auto-reorder is disabled for this bar profile." };
  }

  const stockEntry = barProfile.stockEntries[0];
  if (!stockEntry) {
    return { triggered: false, reason: `No stock entry found for variant ${variantId}.` };
  }

  // 2. Check threshold
  const threshold = stockEntry.minThreshold ?? barProfile.autoReorderThreshold ?? 0;
  if (stockEntry.currentUnits > threshold) {
    return {
      triggered: false,
      reason: `Stock level (${stockEntry.currentUnits}) is above threshold (${threshold}).`,
    };
  }

  // 3. Prevent duplicate orders: check if there's already a DRAFT or PENDING_APPROVAL wholesale order for this bar
  const existingPendingOrder = await prisma.wholesaleOrder.findFirst({
    where: {
      barProfileId,
      status: {
        in: ["DRAFT", "PENDING_APPROVAL"],
      },
      items: {
        some: {
          variantId,
        },
      },
    },
  });

  if (existingPendingOrder) {
    return {
      triggered: false,
      reason: `An active replenishment order (${existingPendingOrder.orderNumber}) is already pending for this variant.`,
    };
  }

  // 4. Determine order quantity
  // Reorder up to maxCapacity if set, otherwise order minOrderQty or one standard box/pack
  const variant = await prisma.productVariant.findUniqueOrThrow({
    where: { id: variantId },
  });

  if (!variant.wholesaleCents) {
    return {
      triggered: false,
      reason: `Variant ${variantId} does not have wholesale pricing. Cannot auto-order.`,
    };
  }

  let orderQty = variant.minOrderQty;
  if (stockEntry.maxCapacity && stockEntry.maxCapacity > stockEntry.currentUnits) {
    const diff = stockEntry.maxCapacity - stockEntry.currentUnits;
    // Align order quantity to minimum order quantity constraints
    orderQty = Math.max(diff, variant.minOrderQty);
  }

  // 5. Place the order automatically
  // Uses our FIFO dispatch engine to allocate batches atomically
  try {
    const dispatchResult = await dispatchWholesaleOrder(barProfileId, [
      {
        variantId,
        quantity: orderQty,
        unitPriceCents: variant.wholesaleCents,
      },
    ], {
      initialOrderStatus: "PENDING_APPROVAL",
      createInvoice: false,
    });

    return {
      triggered: true,
      reason: "Stock fell below threshold. Replenishment order triggered successfully.",
      orderId: dispatchResult.orderId,
      orderNumber: dispatchResult.orderNumber,
    };
  } catch (error: any) {
    return {
      triggered: false,
      reason: `Failed to execute FIFO dispatch: ${error.message || error}`,
    };
  }
}

/**
 * Handle incoming TPV Webhook payload and update stock before evaluation.
 * Payload structure varies by provider (Revo, Lightspeed, Square).
 */
export async function handleTpvStockWebhook(
  barProfileId: string,
  variantSku: string,
  unitsSold: number,
  provider?: string,
): Promise<RepositionTriggerResult & { updatedUnits: number }> {
  const variant = await resolveVariantByTpvIdentifier(provider ?? "unknown", variantSku);

  if (!variant) {
    throw new Error(`Variant with identifier ${variantSku} not found.`);
  }

  const barProfile = await prisma.barProfile.findUnique({
    where: { id: barProfileId },
    select: { autoReorderThreshold: true },
  });

  const stockKey = {
    barProfileId,
    productId: variant.productId,
    variantId: variant.id,
  };

  const existingStock = await prisma.barStock.findUnique({
    where: { barProfileId_productId_variantId: stockKey },
  });

  if (!existingStock) {
    await prisma.barStock.create({
      data: {
        ...stockKey,
        currentUnits: 0,
        minThreshold: barProfile?.autoReorderThreshold ?? 0,
      },
    });
  }

  const updatedStock = await prisma.barStock.update({
    where: { barProfileId_productId_variantId: stockKey },
    data: {
      currentUnits: { decrement: unitsSold },
      lastSyncedAt: new Date(),
    },
  });

  // Outbound: push stock to Holded when product is linked
  try {
    const { pushLocalStockToHolded } = await import("@/lib/integrations/holded-webhook");
    await pushLocalStockToHolded(barProfileId, variant.id, updatedStock.currentUnits);
  } catch (error) {
    console.error("[HOLDED_STOCK_PUSH]", error);
  }

  const evaluation = await evaluateAndTriggerReposition(barProfileId, variant.id);

  return {
    ...evaluation,
    updatedUnits: updatedStock.currentUnits,
  };
}
