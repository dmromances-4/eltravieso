import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { createSubscriptionCheckout } from '@/lib/stripe/api'
import { getOrCreateStripeCustomer } from '@/lib/stripe/customer'
import { clientSafeErrorMessage } from '@/lib/security/safe-error'
import prisma from '@/lib/prisma'
import type { MapPlanTier } from '@prisma/client'

function priceIdForPlan(plan: MapPlanTier): string | undefined {
  if (plan === 'FEATURED') return process.env.STRIPE_MAP_FEATURED_PRICE_ID
  if (plan === 'BOOKING_PLUS') return process.env.STRIPE_MAP_BOOKING_PRICE_ID
  return undefined
}

export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
  }

  let body: { plan?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const plan = body.plan as MapPlanTier
  if (plan !== 'FEATURED' && plan !== 'BOOKING_PLUS') {
    return NextResponse.json({ error: 'Plan no válido' }, { status: 400 })
  }

  const bar = await prisma.barProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, businessName: true },
  })

  if (!bar) {
    return NextResponse.json(
      { error: 'Configura tu perfil de bar en /cuenta/bar antes de contratar un plan' },
      { status: 400 },
    )
  }

  const priceId = priceIdForPlan(plan)
  if (!priceId) {
    return NextResponse.json({ error: 'Plan de mapa no configurado en Stripe' }, { status: 503 })
  }

  try {
    const customerId = await getOrCreateStripeCustomer(session.user.id)
    const checkout = await createSubscriptionCheckout({
      customerId,
      priceId,
      metadata: {
        billingType: 'map_plan',
        barProfileId: bar.id,
        mapPlan: plan,
        userId: session.user.id,
      },
      successPath: '/cuenta/bar',
      cancelPath: '/cuenta/bar',
    })

    return NextResponse.json({ url: checkout.url })
  } catch (error) {
    console.error('[BILLING_MAP_PLAN]', error)
    return NextResponse.json(
      { error: clientSafeErrorMessage(error, 'No se pudo iniciar el plan del mapa') },
      { status: 500 },
    )
  }
}
