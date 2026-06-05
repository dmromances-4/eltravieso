import prisma from '@/lib/prisma'
import { calculateOrderSplits, type SplitLineInput } from '@/lib/checkout/calculate-order-split'
import type { ValidatedCartLine } from '@/lib/checkout/validate-cart'

function nextOrderNumber(): string {
  const year = new Date().getFullYear()
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `VT-${year}-${suffix}`
}

export type CreatePendingOrderInput = {
  userId?: string | null
  guestEmail: string
  lines: ValidatedCartLine[]
}

export async function createPendingOrder(input: CreatePendingOrderInput) {
  const subtotalCents = input.lines.reduce((sum, line) => sum + line.totalCents, 0)
  const taxCents = 0
  const shippingCents = 0
  const totalCents = subtotalCents + taxCents + shippingCents

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: nextOrderNumber(),
        userId: input.userId ?? null,
        guestEmail: input.guestEmail,
        status: 'PENDING',
        subtotalCents,
        taxCents,
        shippingCents,
        totalCents,
        items: {
          create: input.lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity,
            unitPriceCents: line.unitPriceCents,
            totalCents: line.totalCents,
          })),
        },
      },
      include: { items: true },
    })

    const splitInputs: SplitLineInput[] = created.items.map((item, index) => {
      const sourceLine = input.lines[index]
      return {
        orderItemId: item.id,
        productId: item.productId,
        partnerId: sourceLine.partnerId,
        source: sourceLine.source,
        commissionRateBps: sourceLine.commissionRateBps,
        grossCents: item.totalCents,
      }
    })

    const splits = calculateOrderSplits(splitInputs)
    if (splits.length > 0) {
      await tx.orderSplitLine.createMany({
        data: splits.map((split) => ({
          orderId: created.id,
          orderItemId: split.orderItemId,
          productId: split.productId,
          partnerId: split.partnerId,
          grossCents: split.grossCents,
          platformCents: split.platformCents,
          partnerCents: split.partnerCents,
        })),
      })
    }

    return created
  })

  return order
}

export async function confirmOrderFromStripeSession(params: {
  stripeSessionId: string
  stripePaymentId: string | null
}) {
  const order = await prisma.order.findUnique({
    where: { stripeSessionId: params.stripeSessionId },
    include: { items: true },
  })

  if (!order) return null
  if (order.status === 'CONFIRMED') return order

  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CONFIRMED',
        stripePaymentId: params.stripePaymentId ?? order.stripePaymentId,
      },
      include: { items: true, splitLines: true },
    })

    for (const item of updated.items) {
      if (!item.variantId) continue
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    return updated
  })
}

export type CreateVipGiftOrderInput = {
  userId: string
  guestEmail: string
  productId: string
  variantId: string
  shippingAddress: {
    street: string
    city: string
    postalCode: string
    country: string
  }
}

export async function createVipGiftOrder(input: CreateVipGiftOrderInput) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: input.variantId },
    include: { product: true },
  })

  if (!variant || !variant.isActive) {
    throw new Error('Variante de drop no disponible')
  }

  if (variant.productId !== input.productId) {
    throw new Error('Variante no pertenece al producto del drop')
  }

  if (variant.stock < 1) {
    throw new Error('Sin stock para el drop VIP')
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber: nextOrderNumber(),
        userId: input.userId,
        guestEmail: input.guestEmail,
        status: 'CONFIRMED',
        subtotalCents: 0,
        taxCents: 0,
        shippingCents: 0,
        totalCents: 0,
        shippingAddress: input.shippingAddress,
        items: {
          create: {
            productId: input.productId,
            variantId: input.variantId,
            quantity: 1,
            unitPriceCents: 0,
            totalCents: 0,
          },
        },
      },
      include: { items: true },
    })

    await tx.productVariant.update({
      where: { id: input.variantId },
      data: { stock: { decrement: 1 } },
    })

    return order
  })
}
