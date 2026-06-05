import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth/session'
import { dropFulfillmentStatusLabel } from '@/lib/membership/fulfill-drop'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const currentMonth = new Date().toISOString().slice(0, 7)

    const [drops, currentConfig] = await Promise.all([
      prisma.membershipDropFulfillment.findMany({
        where: { userId },
        orderBy: { dropMonth: 'desc' },
        take: 12,
      }),
      prisma.vipMonthlyDrop.findUnique({
        where: { dropMonth: currentMonth },
        include: {
          product: { select: { id: true, title: true, slug: true, imageUrl: true } },
          variant: { select: { id: true, format: true } },
        },
      }),
    ])

    const productIds = drops.map((d) => d.productId).filter(Boolean) as string[]
    const products =
      productIds.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, title: true, slug: true, imageUrl: true },
          })
        : []
    const productMap = new Map(products.map((p) => [p.id, p]))

    return NextResponse.json({
      currentMonth,
      currentDrop: currentConfig
        ? {
            dropMonth: currentConfig.dropMonth,
            label: currentConfig.label,
            product: currentConfig.product,
            variant: currentConfig.variant,
          }
        : null,
      drops: drops.map((d) => ({
        id: d.id,
        dropMonth: d.dropMonth,
        status: d.status,
        statusLabel: dropFulfillmentStatusLabel(d.status),
        productId: d.productId,
        orderId: d.orderId,
        product: d.productId ? productMap.get(d.productId) ?? null : null,
        fulfilledAt: d.fulfilledAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al cargar drops'
    return NextResponse.json({ message }, { status: 500 })
  }
}
