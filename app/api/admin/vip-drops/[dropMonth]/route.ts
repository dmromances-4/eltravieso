import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminUser, adminApiErrorResponse } from '@/lib/auth/admin-api'

type RouteContext = { params: { dropMonth: string } }

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await requireAdminUser()

    const existing = await prisma.vipMonthlyDrop.findUnique({
      where: { dropMonth: params.dropMonth },
    })

    if (!existing) {
      return NextResponse.json({ message: 'Drop no encontrado.' }, { status: 404 })
    }

    await prisma.vipMonthlyDrop.delete({ where: { dropMonth: params.dropMonth } })

    return NextResponse.json({ message: 'Drop eliminado.' })
  } catch (error) {
    return adminApiErrorResponse(error)
  }
}
