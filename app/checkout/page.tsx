import CheckoutForm from '@/components/CheckoutForm'
import { isStripeConfigured } from '@/lib/stripe/api'

export default function CheckoutPage() {
  const paymentsEnabled = isStripeConfigured()

  return (
    <main className="min-h-screen bg-night px-6 py-16 text-white sm:px-8">
      <div className="mx-auto max-w-4xl space-y-10">
        <div className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-10 shadow-neon">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.35em] text-electric-yellow">Checkout</p>
            <h1 className="text-4xl font-display text-white">
              {paymentsEnabled ? 'Paga seguro con Stripe' : 'Revisión de pedido (demo)'}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-300">
              {paymentsEnabled
                ? 'El paso final para tu pedido canalla. Comprobamos stock, firmamos la compra y generamos la factura automática en Holded.'
                : 'Modo demo: puedes revisar el carrito, pero los pagos con tarjeta no están activos en este entorno.'}
            </p>
          </div>
          <div className="mt-12">
            <CheckoutForm paymentsEnabled={paymentsEnabled} />
          </div>
        </div>
      </div>
    </main>
  )
}
