import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad | Vermut El Travieso',
  description: 'Cómo tratamos tus datos y privacidad.',
}

export default function PoliticaPrivacidadPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 text-white">
      <div className="mx-auto max-w-3xl px-6 sm:px-8">
        <Link href="/" className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-electric-yellow mb-12">
          <span className="transition-transform group-hover:-translate-x-1">←</span> Volver al inicio
        </Link>
        
        <div className="space-y-12">
          <header className="space-y-6 border-b border-white/10 pb-12">
            <h1 className="text-4xl font-display font-bold tracking-tight text-white sm:text-5xl">
              Política de Privacidad
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Última actualización: Noviembre 2024
            </p>
          </header>

          <div className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-a:text-electric-yellow prose-a:no-underline hover:prose-a:text-white">
            <h2>1. Responsable del Tratamiento</h2>
            <p>
              El responsable del tratamiento de los datos personales recogidos en esta web es "El Travieso Vermut S.L.".
            </p>

            <h2>2. Finalidad del Tratamiento</h2>
            <p>
              Los datos que nos facilitas a través de los formularios o al registrarte en nuestra tienda se utilizan exclusivamente para:
            </p>
            <ul>
              <li>Gestionar y enviar tus pedidos.</li>
              <li>Responder a tus consultas.</li>
              <li>Enviarte comunicaciones comerciales si nos has dado tu consentimiento explícito.</li>
            </ul>

            <h2>3. Legitimación</h2>
            <p>
              La base legal para el tratamiento de tus datos es el consentimiento que nos otorgas al marcar las casillas correspondientes y la necesidad del tratamiento para la ejecución del contrato de compraventa.
            </p>

            <h2>4. Derechos de los Usuarios</h2>
            <p>
              Tienes derecho a acceder, rectificar y suprimir tus datos, así como otros derechos como la limitación del tratamiento o la portabilidad. Puedes ejercerlos enviando un correo a contacto@eltraviesovermut.com.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
