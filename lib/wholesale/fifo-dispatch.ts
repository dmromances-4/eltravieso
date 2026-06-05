// ─────────────────────────────────────────────────────────────────────────────
// FIFO Dispatch Engine — Assigns ProductionBatch units to wholesale orders
// Strict FIFO: oldest available batch depleted first.
// ─────────────────────────────────────────────────────────────────────────────

import prisma from "@/lib/prisma";
import {
  calculateOrderTaxes,
  generateWholesaleOrderNumber,
  generateInvoiceNumber,
} from "./tax-calculator";
import type { TaxBreakdown } from "./tax-calculator";
import type { InvoiceStatus, WholesaleOrderStatus } from "@prisma/client";

export interface DispatchLineInput {
  variantId: string;
  quantity: number;
  unitPriceCents: number;
}

export interface BatchAllocation {
  batchId: string;
  batchCode: string;
  quantity: number;
}

export interface DispatchOptions {
  createInvoice?: boolean;
  dueDays?: number;
  invoiceStatus?: InvoiceStatus;
  notes?: string;
  initialOrderStatus?: WholesaleOrderStatus;
}

export interface DispatchResult {
  orderId: string;
  orderNumber: string;
  taxes: TaxBreakdown;
  allocations: BatchAllocation[];
  invoiceId?: string;
  invoiceNumber?: string;
}

/**
 * Allocate units from available ProductionBatches using strict FIFO.
 * Returns batch allocations or throws if insufficient stock.
 */
async function allocateFIFO(
  variantId: string,
  requestedQty: number
): Promise<BatchAllocation[]> {
  // Get the productId from the variant
  const variant = await prisma.productVariant.findUniqueOrThrow({
    where: { id: variantId },
    select: { productId: true },
  });

  // Fetch batches FIFO: oldest first, only AVAILABLE with remaining units
  const batches = await prisma.productionBatch.findMany({
    where: {
      productId: variant.productId,
      status: "AVAILABLE",
      remainingUnits: { gt: 0 },
    },
    orderBy: { bottlingDate: "asc" },
  });

  const allocations: BatchAllocation[] = [];
  let remaining = requestedQty;

  for (const batch of batches) {
    if (remaining <= 0) break;

    const take = Math.min(remaining, batch.remainingUnits);
    allocations.push({
      batchId: batch.id,
      batchCode: batch.batchCode,
      quantity: take,
    });
    remaining -= take;
  }

  if (remaining > 0) {
    throw new Error(
      `FIFO_INSUFFICIENT_STOCK: Cannot allocate ${requestedQty} units for variant ${variantId}. Short by ${remaining}.`
    );
  }

  return allocations;
}

/**
 * Dispatch a wholesale order:
 * 1. Validate stock via FIFO allocation
 * 2. Compute taxes (Excise 8% + VAT 21%) in cents
 * 3. Create WholesaleOrder + Items + Batch decrements in a single transaction
 */
export async function dispatchWholesaleOrder(
  barProfileId: string,
  lines: DispatchLineInput[],
  options: DispatchOptions = {}
): Promise<DispatchResult> {
  // ── Phase 1: Pre-validate all FIFO allocations ──
  const allAllocations: Map<string, BatchAllocation[]> = new Map();

  for (const line of lines) {
    const allocations = await allocateFIFO(line.variantId, line.quantity);
    allAllocations.set(line.variantId, allocations);
  }

  // ── Phase 2: Compute taxes ──
  const taxes = calculateOrderTaxes(
    lines.map((l) => ({ unitPriceCents: l.unitPriceCents, quantity: l.quantity }))
  );

  const dueAt = new Date(Date.now() + (options.dueDays ?? 30) * 24 * 60 * 60 * 1000);

  // ── Phase 3: Atomic transaction ──
  const result = await prisma.$transaction(async (tx) => {
    const count = await tx.wholesaleOrder.count();
    const orderNumber = generateWholesaleOrderNumber(count + 1);
    const orderStatus = options.initialOrderStatus ?? "APPROVED";

    const order = await tx.wholesaleOrder.create({
      data: {
        orderNumber,
        barProfileId,
        status: orderStatus,
        subtotalCents: taxes.subtotalCents,
        exciseTaxCents: taxes.exciseTaxCents,
        vatCents: taxes.vatCents,
        totalCents: taxes.totalCents,
        approvedAt: orderStatus === "APPROVED" ? new Date() : null,
      },
    });

    const flatAllocations: BatchAllocation[] = [];

    for (const line of lines) {
      const lineAllocations = allAllocations.get(line.variantId)!;

      for (const alloc of lineAllocations) {
        await tx.wholesaleOrderItem.create({
          data: {
            wholesaleOrderId: order.id,
            variantId: line.variantId,
            batchId: alloc.batchId,
            quantity: alloc.quantity,
            unitPriceCents: line.unitPriceCents,
            totalCents: line.unitPriceCents * alloc.quantity,
          },
        });

        const updatedBatch = await tx.productionBatch.update({
          where: { id: alloc.batchId },
          data: { remainingUnits: { decrement: alloc.quantity } },
        });

        if (updatedBatch.remainingUnits <= 0) {
          await tx.productionBatch.update({
            where: { id: alloc.batchId },
            data: { status: "DEPLETED" },
          });
        }

        flatAllocations.push(alloc);
      }

      await tx.productVariant.update({
        where: { id: line.variantId },
        data: { stock: { decrement: line.quantity } },
      });
    }

    let invoiceId: string | undefined;
    let invoiceNumber: string | undefined;

    if (options.createInvoice) {
      const invoiceCount = await tx.wholesaleInvoice.count();
      const invoiceNumberGenerated = generateInvoiceNumber(invoiceCount + 1);
      const invoice = await tx.wholesaleInvoice.create({
        data: {
          invoiceNumber: invoiceNumberGenerated,
          wholesaleOrderId: order.id,
          status: options.invoiceStatus ?? "DRAFT",
          dueAt,
          subtotalCents: taxes.subtotalCents,
          exciseTaxCents: taxes.exciseTaxCents,
          vatCents: taxes.vatCents,
          totalCents: taxes.totalCents,
          currency: order.currency,
          notes:
            options.notes ??
            `Factura generada automáticamente para el pedido mayorista ${order.orderNumber}`,
        },
      });

      invoiceId = invoice.id;
      invoiceNumber = invoice.invoiceNumber;
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      taxes,
      allocations: flatAllocations,
      invoiceId,
      invoiceNumber,
    };
  });

  return result;
}
