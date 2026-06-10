import Link from 'next/link'
import { NAV_GROUPS } from '@/lib/navigation/groups'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0A0A0A] py-16 text-slate-300">
      <div className="section-shell">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="font-display text-2xl font-bold text-white">
              El Travieso
            </Link>
            <p className="max-w-md text-sm leading-7 text-slate-400">
              Vermut premium canalla. Recetas, locales y cultura de barra en un solo portal.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Descubrir</h3>
            <ul className="space-y-3 text-sm">
              {NAV_GROUPS.discover.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-400 transition-colors hover:text-electric-blue">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Pro & comunidad</h3>
            <ul className="space-y-3 text-sm">
              {[...NAV_GROUPS.pro.links, ...NAV_GROUPS.community.links].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-400 transition-colors hover:text-electric-blue">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Vermut El Travieso</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/aviso-legal" className="hover:text-slate-300">Aviso legal</Link>
            <Link href="/politica-privacidad" className="hover:text-slate-300">Privacidad</Link>
            <Link href="/terminos-y-condiciones" className="hover:text-slate-300">Términos</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
