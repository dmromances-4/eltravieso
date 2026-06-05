import { NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe/api'
import { CartValidationError, validateCartLines } from '@/lib/checkout/validate-cart'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { clientSafeErrorMessage } from '@/lib/security/safe-error'

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'checkout', RATE_LIMITS.checkout)
  if (limited) {
    return NextResponse.json({ error: limited.message }, { status: limited.status, headers: limited.headers })
  }

  let body: { items?: unknown; email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de petición inválido' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Debe proporcionar un email válido' }, { status: 400 })
  }

  try {
    const items = await validateCartLines(body.items as { id: string; quantity: number }[])
    const session = await createCheckoutSession(items, email)
    return NextResponse.json({ url: session.url })
  } catch (error) {
    if (error instanceof CartValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[CHECKOUT_ERROR]:', error)
    return NextResponse.json(
      { error: clientSafeErrorMessage(error, 'Error creando sesión de pago') },
      { status: 500 },
    )
  }
}
