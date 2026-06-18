'use client'

import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

type RecipePremiumGateProps = {
  isPremium: boolean
  lockedFallback: ReactNode
  children: ReactNode
}

export default function RecipePremiumGate({ isPremium, lockedFallback, children }: RecipePremiumGateProps) {
  const t = useTranslations('recipeDetail')
  const { data: session, status } = useSession()
  const isVip = Boolean(session?.user?.isVip)

  if (!isPremium) return <>{children}</>

  if (status === 'loading') {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-8 text-sm text-slate-400">
        {t('checkingVip')}
      </div>
    )
  }

  if (!isVip) return <>{lockedFallback}</>

  return <>{children}</>
}
