import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aviso Legal | Vermut El Travieso',
  description: 'Información legal de la empresa.',
}

export default function AvisoLegalPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 text-white">
      <div className="mx-auto max-w-3xl px-6 sm:px-8">
        <Link href="/" className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-electric-yellow mb-12">
          <span className="transition-transform group-hover:-translate-x-1">←</span> Volver al inicio
        </Link>
        
        <div className="space-y-12">
          <header className="space-y-6 border-b border-white/10 pb-12">
            <h1 className="text-4xl font-display font-bold tracking-tight text-white sm:text-5xl">
              Aviso Legal
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Última actualización: Noviembre 2024
            </p>
          </header>

          <div className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-a:text-electric-yellow prose-a:no-underline hover:prose-a:text-white">
            <h2>1. Información General</h2>
            <p>
              En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), 
              se informa que este sitio web es propiedad de "El Travieso Vermut S.L.".
            </p>
            <ul>
              <li><strong>Denominación social:</strong> El Travieso Vermut S.L.</li>
              <li><strong>NIF:</strong> B-XXXXXXXX</li>
              <li><strong>Domicilio social:</strong> Calle Falsa 123, 28000 Madrid, España</li>
              <li><strong>Email de contacto:</strong> contacto@eltraviesovermut.com</li>
            </ul>

            <h2>2. Propiedad Intelectual</h2>
            <p>
              El diseño del portal y sus códigos fuente, así como los logos, marcas y demás signos distintivos que aparecen en el mismo 
              pertenecen a El Travieso Vermut y están protegidos por los correspondientes derechos de propiedad intelectual e industrial.
            </p>

            <h2>3. Responsabilidad</h2>
            <p>
              El Travieso Vermut no se hace responsable de la legalidad de otros sitios web de terceros desde los que pueda accederse 
              al portal. Tampoco responde por la legalidad de otros sitios web de terceros, que pudieran estar vinculados o enlazados desde este portal.
            </p>

            <h2>4. Ley Aplicable y Jurisdicción</h2>
            <p>
              La ley aplicable en caso de disputa o conflicto de interpretación de los términos que conforman este aviso legal, 
              así como cualquier cuestión relacionada con los servicios del presente portal, será la ley española.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
