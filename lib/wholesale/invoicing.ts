import prisma from "@/lib/prisma";
import { generateInvoiceNumber } from "./tax-calculator";
import type { InvoiceStatus } from "@prisma/client";

export interface CreateWholesaleInvoiceOptions {
  dueDays?: number;
  status?: InvoiceStatus;
  notes?: string;
}

export async function createWholesaleInvoiceForOrder(
  orderId: string,
  options: CreateWholesaleInvoiceOptions = {}
) {
  const order = await prisma.wholesaleOrder.findUniqueOrThrow({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      subtotalCents: true,
      exciseTaxCents: true,
      vatCents: true,
      totalCents: true,
      currency: true,
    },
  });

  const invoiceCount = await prisma.wholesaleInvoice.count();
  const invoiceNumber = generateInvoiceNumber(invoiceCount + 1);
  const dueAt = new Date(Date.now() + (options.dueDays ?? 30) * 24 * 60 * 60 * 1000);

  const invoice = await prisma.wholesaleInvoice.create({
    data: {
      invoiceNumber,
      wholesaleOrderId: order.id,
      status: options.status ?? "DRAFT",
      dueAt,
      subtotalCents: order.subtotalCents,
      exciseTaxCents: order.exciseTaxCents,
      vatCents: order.vatCents,
      totalCents: order.totalCents,
      currency: order.currency,
      notes:
        options.notes ??
        `Factura automática generada para el pedido mayorista ${order.orderNumber}`,
    },
  });

  return invoice;
}
