import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import {
  dropFulfillmentStatusLabel,
  fulfillVipDrop,
  VipMembershipRequiredError,
} from '@/lib/membership/fulfill-drop'

export async function POST() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const dropMonth = new Date().toISOString().slice(0, 7)
    const result = await fulfillVipDrop(session.user.id, dropMonth)

    return NextResponse.json({
      status: result.status,
      statusLabel: dropFulfillmentStatusLabel(result.status),
      orderId: result.orderId,
      message:
        result.status === 'ORDER_CREATED'
          ? 'Pedido de drop creado correctamente.'
          : dropFulfillmentStatusLabel(result.status),
    })
  } catch (error) {
    if (error instanceof VipMembershipRequiredError) {
      return NextResponse.json({ message: error.message }, { status: 403 })
    }

    const message = error instanceof Error ? error.message : 'Error al procesar drop'
    return NextResponse.json({ message }, { status: 500 })
  }
}
