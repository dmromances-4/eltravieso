import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0A0A0A] pt-16 pb-8 text-slate-300">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2 space-y-6">
            <Link href="/" className="inline-block font-display text-2xl font-bold tracking-tighter text-white">
              EL TRAVIESO
            </Link>
            <p className="max-w-md text-sm leading-7 text-slate-400">
              Brutalismo refinado, scroll suave y coctelería urbana para paladares que conocen la noche. Vermut premium canalla.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white mb-6">Navegación</h3>
            <ul className="space-y-4 text-sm">
              <li><Link href="/cuenta" className="hover:text-electric-yellow transition-colors">Mi cuenta</Link></li>
              <li><Link href="/recetas" className="hover:text-electric-yellow transition-colors">Recetas</Link></li>
              <li><Link href="/pro/tech-generator" className="hover:text-electric-yellow transition-colors">Barra IA</Link></li>
              <li><Link href="/shop" className="hover:text-electric-yellow transition-colors">Shop</Link></li>
              <li><Link href="/blog" className="hover:text-electric-yellow transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white mb-6">Legal</h3>
            <ul className="space-y-4 text-sm">
              <li><Link href="/aviso-legal" className="hover:text-white transition-colors">Aviso Legal</Link></li>
              <li><Link href="/politica-privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link></li>
              <li><Link href="/terminos-y-condiciones" className="hover:text-white transition-colors">Términos y Condiciones</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Vermut El Travieso. Todos los derechos reservados.</p>
          <div className="flex gap-4 uppercase tracking-widest">
            <span>Bebe con moderación</span>
            <span>18+</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
