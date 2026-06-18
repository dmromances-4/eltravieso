'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useCart } from '@/lib/cart/CartContext'

export default function CartClient() {
  const t = useTranslations('cart')
  const tCommon = useTranslations('common')
  const { items, updateQty, removeFromCart, subtotalCents } = useCart()

  return (
    <main className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 sm:px-8">
        <Link href="/shop" className="group mb-12 inline-flex min-h-[44px] items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-electric-yellow">
          <span className="transition-transform group-hover:-translate-x-1">←</span> {tCommon('back')}
        </Link>

        <h1 className="mb-8 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">{t('title')}</h1>

        {items.length === 0 ? (
          <div className="rounded-[2.5rem] border border-white/10 bg-[#121212] p-16 text-center shadow-neon">
            <h2 className="mb-4 font-display text-2xl text-white">{t('empty')}</h2>
            <Link href="/shop" className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-electric-yellow px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-black">
              {t('checkout')}
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-[1fr_350px] lg:grid-cols-[1fr_350px]">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col items-start gap-6 rounded-[2rem] border border-white/10 bg-[#121212] p-6 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-grow">
                    <h3 className="text-lg font-bold text-white">{item.name}</h3>
                    <button onClick={() => removeFromCart(item.id)} className="mt-2 min-h-[44px] text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-red-500">
                      {t('remove')}
                    </button>
                  </div>
                  <div className="flex w-full items-center justify-between gap-8 sm:w-auto">
                    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#161616] p-1">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white">−</button>
                      <span className="w-4 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white">+</button>
                    </div>
                    <p className="text-lg font-bold text-electric-yellow">{((item.amount * item.quantity) / 100).toFixed(2)} €</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-fit rounded-[2rem] border border-white/10 bg-[#121212] p-8 shadow-neon">
              <div className="mb-6 flex justify-between border-b border-white/10 pb-6">
                <span className="text-slate-400">{t('subtotal')}</span>
                <span className="font-bold text-white">{(subtotalCents / 100).toFixed(2)} €</span>
              </div>
              <Link href="/checkout" className="flex min-h-[44px] w-full items-center justify-center rounded-full bg-electric-yellow px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-black">
                {t('checkout')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
