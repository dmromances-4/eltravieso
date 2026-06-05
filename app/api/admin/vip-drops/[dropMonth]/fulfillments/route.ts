import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminUser, adminApiErrorResponse } from '@/lib/auth/admin-api'

type RouteContext = { params: { dropMonth: string } }

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await requireAdminUser()
    const body = await request.json()
    const fulfillmentId = typeof body.fulfillmentId === 'string' ? body.fulfillmentId : ''
    const status = body.status === 'FULFILLED' ? 'FULFILLED' : null

    if (!fulfillmentId || !status) {
      return NextResponse.json({ message: 'fulfillmentId y status FULFILLED requeridos.' }, { status: 400 })
    }

    const updated = await prisma.membershipDropFulfillment.updateMany({
      where: { id: fulfillmentId, dropMonth: params.dropMonth },
      data: { status: 'FULFILLED' },
    })

    if (updated.count === 0) {
      return NextResponse.json({ message: 'Fulfillment no encontrado.' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Marcado como enviado.' })
  } catch (error) {
    return adminApiErrorResponse(error)
  }
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireAdminUser()

    const fulfillments = await prisma.membershipDropFulfillment.findMany({
      where: { dropMonth: params.dropMonth },
      orderBy: { fulfilledAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    })

    return NextResponse.json({
      fulfillments: fulfillments.map((f) => ({
        id: f.id,
        userId: f.userId,
        userEmail: f.user.email,
        userName: f.user.name,
        status: f.status,
        productId: f.productId,
        orderId: f.orderId,
        fulfilledAt: f.fulfilledAt.toISOString(),
      })),
    })
  } catch (error) {
    return adminApiErrorResponse(error)
  }
}
