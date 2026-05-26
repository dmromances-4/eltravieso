'use client'

import { ChangeEvent, useMemo, useState } from 'react'

interface CheckoutFormProps {
  items: Array<{ id: string; name: string; description: string; amount: number; quantity: number; image: string }>
}

export default function CheckoutForm({ items }: CheckoutFormProps) {
  const [email, setEmail] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const total = useMemo(() => items.reduce((sum, item) => sum + item.amount * item.quantity, 0), [items])

  const handleCheckout = async () => {
    setError(null)
    if (!email || !acceptedTerms || !acceptedPrivacy) {
      setError('Debes completar el email y aceptar los términos y la política de privacidad.')
      return
    }
    setLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, items })
      })
      const payload = await response.json()
      if (payload.url) {
        window.location.href = payload.url
      } else {
        setError(payload.error ?? 'Error desconocido creando la sesión de pago')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 rounded-[2.5rem] border border-white/10 bg-[#111111]/90 p-8 shadow-neon backdrop-blur-xl">
      <div className="space-y-4">
        <h2 className="text-3xl font-display font-bold tracking-tight text-white">Confirmación de pedido</h2>
        <p className="text-sm leading-7 text-slate-300">Revisa tu carrito y completa tus datos antes de ir al pago seguro con Stripe.</p>
      </div>
      
      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-3xl border border-white/5 bg-[#0f0f0f]/80 p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-white text-lg">{item.name}</p>
              <p className="text-sm text-slate-400 mt-1">{item.description}</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-electric-yellow">{((item.amount * item.quantity) / 100).toFixed(2)} €</span>
              <p className="text-xs text-slate-500 mt-1">Cant: {item.quantity}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="space-y-6 rounded-3xl border border-white/10 bg-[#161616] p-6">
        <div className="flex items-center justify-between text-sm text-slate-400 border-b border-white/10 pb-4">
          <span className="font-bold uppercase tracking-widest text-xs">Total a pagar</span>
          <span className="text-2xl font-bold text-white">{(total / 100).toFixed(2)} €</span>
        </div>
        
        <div className="space-y-4 pt-2">
          <label className="flex items-start gap-4 text-sm text-slate-300 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input type="checkbox" checked={acceptedTerms} onChange={(event: ChangeEvent<HTMLInputElement>) => setAcceptedTerms(event.target.checked)} className="peer appearance-none h-5 w-5 rounded border border-white/20 bg-[#0f0f0f] checked:bg-electric-yellow checked:border-electric-yellow transition-all focus:outline-none focus:ring-2 focus:ring-electric-yellow focus:ring-offset-2 focus:ring-offset-[#161616]" />
              <svg className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <span className="leading-6">Acepto los <a href="/terminos-y-condiciones" className="text-white border-b border-white/30 transition-colors hover:text-electric-yellow hover:border-electric-yellow">términos y condiciones</a> de venta</span>
          </label>
          <label className="flex items-start gap-4 text-sm text-slate-300 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input type="checkbox" checked={acceptedPrivacy} onChange={(event: ChangeEvent<HTMLInputElement>) => setAcceptedPrivacy(event.target.checked)} className="peer appearance-none h-5 w-5 rounded border border-white/20 bg-[#0f0f0f] checked:bg-electric-yellow checked:border-electric-yellow transition-all focus:outline-none focus:ring-2 focus:ring-electric-yellow focus:ring-offset-2 focus:ring-offset-[#161616]" />
              <svg className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <span className="leading-6">He leído y acepto la <a href="/politica-privacidad" className="text-white border-b border-white/30 transition-colors hover:text-electric-yellow hover:border-electric-yellow">política de privacidad</a></span>
          </label>
        </div>
        
        <div className="pt-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-300">
            <span className="uppercase tracking-widest text-[10px] text-slate-500">Email para el pedido</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
                placeholder="cliente@ejemplo.com"
                className="w-full rounded-full border border-white/10 bg-[#0f0f0f] pl-11 pr-4 py-3.5 text-white outline-none transition-all focus:border-electric-yellow focus:ring-1 focus:ring-electric-yellow placeholder:text-slate-600"
              />
            </div>
          </label>
        </div>
      </div>
      
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 animate-[shake_0.5s_ease-in-out]">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>{error}</span>
          </div>
        </div>
      )}
      
      <button
        type="button"
        disabled={loading}
        onClick={handleCheckout}
        className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-electric-yellow px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-black transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,204,0,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <svg className="h-5 w-5 animate-spin text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span>Procesando...</span>
          </>
        ) : (
          <>
            <span>Pagar con Stripe</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
          </>
        )}
      </button>
    </div>
  )
}
