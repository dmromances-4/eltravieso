import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Vermut El Travieso',
  description: 'Términos de compra y uso del servicio.',
}

export default function TerminosYCondicionesPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 text-white">
      <div className="mx-auto max-w-3xl px-6 sm:px-8">
        <Link href="/" className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-electric-yellow mb-12">
          <span className="transition-transform group-hover:-translate-x-1">←</span> Volver al inicio
        </Link>
        
        <div className="space-y-12">
          <header className="space-y-6 border-b border-white/10 pb-12">
            <h1 className="text-4xl font-display font-bold tracking-tight text-white sm:text-5xl">
              Términos y Condiciones
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Última actualización: Noviembre 2024
            </p>
          </header>

          <div className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-a:text-electric-yellow prose-a:no-underline hover:prose-a:text-white">
            <h2>1. Edad Mínima de Compra</h2>
            <p>
              Para comprar productos alcohólicos en nuestra tienda debes ser mayor de 18 años. Al realizar un pedido, confirmas que cumples con este requisito legal. Nos reservamos el derecho de solicitar una identificación válida en el momento de la entrega.
            </p>

            <h2>2. Precios y Pago</h2>
            <p>
              Todos los precios indicados en nuestra tienda incluyen el IVA y otros impuestos aplicables. Los gastos de envío se calcularán y añadirán durante el proceso de pago. Aceptamos pagos seguros mediante tarjeta de crédito/débito a través de Stripe.
            </p>

            <h2>3. Envíos y Plazos de Entrega</h2>
            <p>
              Realizamos envíos a toda la Península Ibérica. El plazo de entrega estimado es de 24 a 72 horas laborables desde la confirmación del pedido. No nos hacemos responsables de retrasos causados por fuerza mayor o problemas logísticos de la empresa de transporte.
            </p>

            <h2>4. Devoluciones</h2>
            <p>
              Tienes un plazo de 14 días naturales desde la recepción de tu pedido para ejercer tu derecho de desistimiento. Para que la devolución sea aceptada, las botellas deben estar sin abrir y con su precinto intacto. Los gastos de envío de la devolución correrán a cargo del cliente, salvo en caso de producto defectuoso.
            </p>

            <h2>5. Modificaciones de los Términos</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. Las modificaciones entrarán en vigor a partir de su publicación en el sitio web.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
