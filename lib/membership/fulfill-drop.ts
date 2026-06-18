import type { DropFulfillmentStatus, MembershipStatus } from '@prisma/client'
import prisma from '@/lib/prisma'
import { createVipGiftOrder } from '@/lib/checkout/create-order'

export class VipMembershipRequiredError extends Error {
  constructor() {
    super('Membresía VIP activa requerida para procesar el drop')
    this.name = 'VipMembershipRequiredError'
  }
}

export function vipDropAutoFulfillEnabled(): boolean {
  const flag = process.env.VIP_DROP_AUTO_FULFILL
  if (flag === undefined || flag === '') return true
  return flag === 'true' || flag === '1'
}

export function userHasShippingAddress(user: {
  address: string | null
  city: string | null
  postalCode: string | null
}): boolean {
  return Boolean(user.address?.trim() && user.city?.trim() && user.postalCode?.trim())
}

export function userHasActiveVipMembership(user: {
  membershipStatus: MembershipStatus
  membershipExpiresAt: Date | null
}): boolean {
  if (user.membershipStatus !== 'ACTIVE') return false
  if (user.membershipExpiresAt && user.membershipExpiresAt < new Date()) return false
  return true
}

export function dropFulfillmentStatusLabel(status: DropFulfillmentStatus): string {
  switch (status) {
    case 'PENDING_PRODUCT':
      return 'Drop del mes pendiente de configurar'
    case 'PENDING_ADDRESS':
      return 'Completa tu dirección de envío'
    case 'ORDER_CREATED':
      return 'Pedido creado — en preparación'
    case 'FULFILLED':
      return 'Enviado'
    default:
      return status
  }
}

async function resolveDropVariant(
  productId: string,
  variantId: string | null | undefined
): Promise<string | null> {
  if (variantId) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId, isActive: true },
    })
    return variant?.id ?? null
  }

  const variant = await prisma.productVariant.findFirst({
    where: {
      productId,
      isActive: true,
      channel: { in: ['B2C', 'BOTH'] },
      stock: { gt: 0 },
    },
    orderBy: { priceCents: 'asc' },
  })

  return variant?.id ?? null
}

export type FulfillVipDropResult = {
  status: DropFulfillmentStatus
  orderId: string | null
  productId: string | null
}

export async function fulfillVipDrop(userId: string, dropMonth: string): Promise<FulfillVipDropResult> {
  const existing = await prisma.membershipDropFulfillment.findUnique({
    where: { userId_dropMonth: { userId, dropMonth } },
  })

  if (existing?.orderId && (existing.status === 'ORDER_CREATED' || existing.status === 'FULFILLED')) {
    return {
      status: existing.status,
      orderId: existing.orderId,
      productId: existing.productId,
    }
  }

  const dropConfig = await prisma.vipMonthlyDrop.findUnique({
    where: { dropMonth },
    include: { product: true, variant: true },
  })

  if (!dropConfig) {
    const updated = await prisma.membershipDropFulfillment.upsert({
      where: { userId_dropMonth: { userId, dropMonth } },
      create: { userId, dropMonth, status: 'PENDING_PRODUCT' },
      update: { status: 'PENDING_PRODUCT', productId: null, orderId: null },
    })
    return { status: updated.status, orderId: null, productId: null }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      address: true,
      city: true,
      postalCode: true,
      country: true,
      membershipStatus: true,
      membershipExpiresAt: true,
    },
  })

  if (!user) {
    throw new Error(`Usuario ${userId} no encontrado`)
  }

  if (!userHasActiveVipMembership(user)) {
    throw new VipMembershipRequiredError()
  }

  if (!userHasShippingAddress(user)) {
    const updated = await prisma.membershipDropFulfillment.upsert({
      where: { userId_dropMonth: { userId, dropMonth } },
      create: {
        userId,
        dropMonth,
        productId: dropConfig.productId,
        status: 'PENDING_ADDRESS',
      },
      update: {
        productId: dropConfig.productId,
        status: 'PENDING_ADDRESS',
        orderId: null,
      },
    })
    return { status: updated.status, orderId: null, productId: updated.productId }
  }

  if (!vipDropAutoFulfillEnabled()) {
    const updated = await prisma.membershipDropFulfillment.upsert({
      where: { userId_dropMonth: { userId, dropMonth } },
      create: {
        userId,
        dropMonth,
        productId: dropConfig.productId,
        status: 'PENDING_PRODUCT',
      },
      update: { productId: dropConfig.productId },
    })
    return { status: updated.status, orderId: null, productId: updated.productId }
  }

  const resolvedVariantId = await resolveDropVariant(dropConfig.productId, dropConfig.variantId)
  if (!resolvedVariantId) {
    const updated = await prisma.membershipDropFulfillment.upsert({
      where: { userId_dropMonth: { userId, dropMonth } },
      create: {
        userId,
        dropMonth,
        productId: dropConfig.productId,
        status: 'PENDING_PRODUCT',
      },
      update: { productId: dropConfig.productId, status: 'PENDING_PRODUCT', orderId: null },
    })
    return { status: updated.status, orderId: null, productId: updated.productId }
  }

  const order = await createVipGiftOrder({
    userId: user.id,
    guestEmail: user.email,
    productId: dropConfig.productId,
    variantId: resolvedVariantId,
    shippingAddress: {
      street: user.address!.trim(),
      city: user.city!.trim(),
      postalCode: user.postalCode!.trim(),
      country: user.country?.trim() || 'España',
    },
  })

  const updated = await prisma.membershipDropFulfillment.upsert({
    where: { userId_dropMonth: { userId, dropMonth } },
    create: {
      userId,
      dropMonth,
      productId: dropConfig.productId,
      orderId: order.id,
      status: 'ORDER_CREATED',
    },
    update: {
      productId: dropConfig.productId,
      orderId: order.id,
      status: 'ORDER_CREATED',
    },
  })

  return {
    status: updated.status,
    orderId: updated.orderId,
    productId: updated.productId,
  }
}

export async function processPendingDropsForMonth(dropMonth: string): Promise<{ processed: number; errors: number }> {
  const pending = await prisma.membershipDropFulfillment.findMany({
    where: {
      dropMonth,
      status: { in: ['PENDING_PRODUCT', 'PENDING_ADDRESS'] },
    },
    select: { userId: true },
  })

  let processed = 0
  let errors = 0

  for (const row of pending) {
    try {
      const result = await fulfillVipDrop(row.userId, dropMonth)
      if (result.status === 'ORDER_CREATED' || result.status === 'FULFILLED') {
        processed += 1
      }
    } catch {
      errors += 1
    }
  }

  return { processed, errors }
}
