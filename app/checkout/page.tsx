import CheckoutForm from '@/components/CheckoutForm'

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-night px-6 py-16 text-white sm:px-8">
      <div className="mx-auto max-w-4xl space-y-10">
        <div className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-10 shadow-neon">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.35em] text-electric-yellow">Checkout</p>
            <h1 className="text-4xl font-display text-white">Paga seguro con Stripe</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-300">El paso final para tu pedido canalla. Comprobamos stock, firmamos la compra y generamos la factura automática en Holded.</p>
          </div>
          <div className="mt-12">
            <CheckoutForm />
          </div>
        </div>
      </div>
    </main>
  )
}
