import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminUser, adminApiErrorResponse } from '@/lib/auth/admin-api'

const DROP_MONTH_RE = /^\d{4}-\d{2}$/

function parseDropMonth(value: unknown): string | null {
  if (typeof value !== 'string' || !DROP_MONTH_RE.test(value)) return null
  return value
}

export async function GET() {
  try {
    await requireAdminUser()

    const [drops, products] = await Promise.all([
      prisma.vipMonthlyDrop.findMany({
        orderBy: { dropMonth: 'desc' },
        include: {
          product: { select: { id: true, title: true, slug: true } },
          variant: { select: { id: true, sku: true, format: true, stock: true } },
        },
      }),
      prisma.product.findMany({
        where: { isActive: true, channel: { in: ['B2C', 'BOTH'] } },
        orderBy: { title: 'asc' },
        select: {
          id: true,
          title: true,
          slug: true,
          variants: {
            where: { isActive: true, channel: { in: ['B2C', 'BOTH'] } },
            select: { id: true, sku: true, format: true, stock: true, priceCents: true },
            orderBy: { priceCents: 'asc' },
          },
        },
      }),
    ])

    const dropsWithStats = await Promise.all(
      drops.map(async (drop) => {
        const counts = await prisma.membershipDropFulfillment.groupBy({
          by: ['status'],
          where: { dropMonth: drop.dropMonth },
          _count: { _all: true },
        })
        const statusCounts = Object.fromEntries(
          counts.map((c) => [c.status, c._count._all])
        ) as Record<string, number>

        return {
          id: drop.id,
          dropMonth: drop.dropMonth,
          label: drop.label,
          productId: drop.productId,
          variantId: drop.variantId,
          product: drop.product,
          variant: drop.variant,
          createdAt: drop.createdAt.toISOString(),
          statusCounts,
        }
      })
    )

    return NextResponse.json({ drops: dropsWithStats, products })
  } catch (error) {
    return adminApiErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUser()
    const body = await request.json()

    const dropMonth = parseDropMonth(body.dropMonth)
    const productId = typeof body.productId === 'string' ? body.productId.trim() : ''
    const variantId =
      body.variantId != null && body.variantId !== ''
        ? String(body.variantId).trim()
        : null
    const label = typeof body.label === 'string' ? body.label.trim() || null : null

    if (!dropMonth) {
      return NextResponse.json({ message: 'dropMonth inválido (formato YYYY-MM).' }, { status: 400 })
    }
    if (!productId) {
      return NextResponse.json({ message: 'productId es obligatorio.' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          where: { isActive: true },
          select: { id: true, productId: true },
        },
      },
    })

    if (!product || !product.isActive) {
      return NextResponse.json({ message: 'Producto no encontrado.' }, { status: 404 })
    }

    if (variantId) {
      const variant = product.variants.find((v) => v.id === variantId)
      if (!variant) {
        return NextResponse.json({ message: 'Variante no pertenece al producto.' }, { status: 400 })
      }
    }

    const drop = await prisma.vipMonthlyDrop.upsert({
      where: { dropMonth },
      create: { dropMonth, productId, variantId, label },
      update: { productId, variantId, label },
      include: {
        product: { select: { id: true, title: true, slug: true } },
        variant: { select: { id: true, sku: true, format: true, stock: true } },
      },
    })

    return NextResponse.json({
      drop: {
        id: drop.id,
        dropMonth: drop.dropMonth,
        label: drop.label,
        productId: drop.productId,
        variantId: drop.variantId,
        product: drop.product,
        variant: drop.variant,
        createdAt: drop.createdAt.toISOString(),
      },
      message: 'Drop VIP guardado.',
    })
  } catch (error) {
    return adminApiErrorResponse(error)
  }
}
