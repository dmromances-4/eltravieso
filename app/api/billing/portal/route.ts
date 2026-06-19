import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { createBillingPortalSession } from '@/lib/stripe/api'
import { getOrCreateStripeCustomer } from '@/lib/stripe/customer'
import { clientSafeErrorMessage, logServerError } from '@/lib/security/safe-error'

export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
  }

  let returnPath = '/cuenta/membresia'
  try {
    const body = await request.json()
    if (typeof body.returnPath === 'string' && body.returnPath.startsWith('/')) {
      returnPath = body.returnPath
    }
  } catch {
    // default return path
  }

  try {
    const customerId = await getOrCreateStripeCustomer(session.user.id)
    const portal = await createBillingPortalSession(customerId, returnPath)
    return NextResponse.json({ url: portal.url })
  } catch (error) {
    logServerError('billing-portal', error)
    return NextResponse.json(
      { error: clientSafeErrorMessage(error, 'No se pudo abrir el portal de facturación') },
      { status: 500 },
    )
  }
}
