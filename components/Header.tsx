'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCart } from '@/lib/cart/CartContext'
import { NavGroup } from '@/components/ui/NavGroup'
import { NAV_GROUPS } from '@/lib/navigation/groups'
import { cn } from '@/lib/utils'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { count: cartCount } = useCart()

  const isAuthenticated = status === 'authenticated' && session?.user

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          isScrolled ? 'border-b border-white/10 bg-[#0a0a0a]/95 py-3 backdrop-blur-md' : 'bg-transparent py-5',
        )}
      >
        <div className="section-shell flex items-center justify-between gap-4">
          <Link href="/" className="group z-50 font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
            <span className="transition-colors group-hover:text-electric-yellow">El Travieso</span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <NavGroup label={NAV_GROUPS.discover.label} links={[...NAV_GROUPS.discover.links]} />
            <NavGroup label={NAV_GROUPS.pro.label} links={[...NAV_GROUPS.pro.links]} />
            <NavGroup label={NAV_GROUPS.community.label} links={[...NAV_GROUPS.community.links]} />
          </nav>

          <div className="z-50 flex items-center gap-3">
            <Link href="/cart" className="relative p-2 text-white transition-colors hover:text-electric-yellow" aria-label={`Carrito${cartCount > 0 ? ` (${cartCount})` : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              {cartCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-pill bg-electric-yellow px-1 text-[10px] font-bold text-black">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              ) : null}
            </Link>

            {isAuthenticated ? (
              <Link href="/cuenta" className="hidden items-center gap-2 rounded-pill border border-white/10 px-3 py-1.5 md:inline-flex">
                <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
                  {session.user.image ? (
                    <Image src={session.user.image} alt="" fill className="object-cover" sizes="28px" unoptimized />
                  ) : (
                    <span className="text-xs font-semibold text-electric-yellow">
                      {(session.user.name || session.user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="max-w-[100px] truncate text-sm font-medium text-slate-200">
                  {session.user.name?.split(' ')[0] || 'Cuenta'}
                </span>
              </Link>
            ) : (
              <Link href="/login" className="hidden rounded-pill border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-electric-yellow/40 md:inline-flex">
                Entrar
              </Link>
            )}

            <button type="button" className="p-2 text-white lg:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Menú">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isMobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#0a0a0a]/98 pt-24 backdrop-blur-xl lg:hidden"
          >
            <nav className="section-shell space-y-8 pb-12">
              {Object.values(NAV_GROUPS).map((group) => (
                <div key={group.label}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</p>
                  <div className="space-y-1">
                    {group.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          'block rounded-card px-4 py-3 text-base font-medium transition-colors',
                          pathname === link.href ? 'bg-electric-yellow/10 text-electric-yellow' : 'text-slate-200 hover:bg-white/5',
                        )}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              <div className="border-t border-white/10 pt-6">
                <Link href={isAuthenticated ? '/cuenta' : '/login'} className="text-sm font-medium text-electric-blue">
                  {isAuthenticated ? 'Mi cuenta' : 'Entrar o registrarse'}
                </Link>
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
