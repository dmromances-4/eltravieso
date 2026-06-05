'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import type { ReactNode } from 'react'

type RecipePremiumGateProps = {
  isPremium: boolean
  lockedFallback: ReactNode
  children: ReactNode
}

export default function RecipePremiumGate({ isPremium, lockedFallback, children }: RecipePremiumGateProps) {
  const { data: session, status } = useSession()
  const isVip = Boolean(session?.user?.isVip)

  if (!isPremium) return <>{children}</>

  if (status === 'loading') {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-8 text-sm text-slate-400">
        Comprobando acceso VIP…
      </div>
    )
  }

  if (!isVip) return <>{lockedFallback}</>

  return <>{children}</>
}
