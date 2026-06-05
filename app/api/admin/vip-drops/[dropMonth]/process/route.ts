import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminUser, adminApiErrorResponse } from '@/lib/auth/admin-api'
import { processPendingDropsForMonth } from '@/lib/membership/fulfill-drop'

type RouteContext = { params: { dropMonth: string } }

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    await requireAdminUser()

    const drop = await prisma.vipMonthlyDrop.findUnique({
      where: { dropMonth: params.dropMonth },
    })

    if (!drop) {
      return NextResponse.json(
        { message: 'Configura el drop del mes antes de procesar pendientes.' },
        { status: 400 }
      )
    }

    const result = await processPendingDropsForMonth(params.dropMonth)

    return NextResponse.json({
      message: `Procesados ${result.processed} drops. Errores: ${result.errors}.`,
      ...result,
    })
  } catch (error) {
    return adminApiErrorResponse(error)
  }
}
