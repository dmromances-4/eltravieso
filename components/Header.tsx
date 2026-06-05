'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCart } from '@/lib/cart/CartContext'

const navLinks = [
  { name: 'Inicio', href: '/' },
  { name: 'Recetas', href: '/recetas' },
  { name: 'Barra IA', href: '/pro/tech-generator' },
  { name: 'Bar Online', href: '/bar-online' },
  { name: 'Shop', href: '/shop' },
  { name: 'Mapa', href: '/mapa' },
  { name: 'Comunidad', href: '/comunidad' },
  { name: 'Blog', href: '/blog' },
]

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { count: cartCount } = useCart()

  const isAuthenticated = status === 'authenticated' && session?.user
  const accountHref = isAuthenticated ? '/cuenta' : '/login'
  const accountLabel = isAuthenticated ? 'Mi cuenta' : 'Entrar'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
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
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10 shadow-lg py-4' : 'bg-transparent py-6'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-8">
          <Link href="/" className="group relative z-50 flex items-center gap-2">
            <span className="font-display text-2xl font-bold tracking-tighter text-white transition-colors group-hover:text-electric-yellow">
              EL TRAVIESO
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className={`text-sm font-semibold uppercase tracking-[0.2em] transition-colors ${
                  pathname === link.href ? 'text-electric-yellow' : 'text-slate-300 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4 z-50">
            <Link href="/cart" className="relative group p-2" aria-label={`Carrito${cartCount > 0 ? ` (${cartCount})` : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white group-hover:text-electric-yellow transition-colors"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-electric-yellow px-1 text-[10px] font-bold text-black">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <Link
                href="/cuenta"
                className="hidden items-center gap-2 rounded-full border border-electric-yellow/20 bg-electric-yellow/5 px-3 py-1.5 md:inline-flex"
              >
                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-electric-yellow/20">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="32px"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xs font-bold text-electric-yellow">
                      {(session.user.name || session.user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-electric-yellow max-w-[120px] truncate">
                  {session.user.name?.split(' ')[0] || 'Cuenta'}
                </span>
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 transition hover:text-white md:inline-flex"
                >
                  Registro
                </Link>
                <Link
                  href="/login"
                  className="hidden rounded-full border border-electric-yellow/20 bg-electric-yellow/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-electric-yellow transition-all hover:bg-electric-yellow/10 md:inline-flex"
                >
                  Entrar
                </Link>
              </>
            )}

            <button
              className="md:hidden p-2 text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isMobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </>
                ) : (
                  <>
                    <line x1="4" y1="12" x2="20" y2="12"></line>
                    <line x1="4" y1="6" x2="20" y2="6"></line>
                    <line x1="4" y1="18" x2="20" y2="18"></line>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#0F0F0F]/95 backdrop-blur-xl md:hidden pt-24"
          >
            <nav className="flex flex-col items-center gap-8 p-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-xl font-display uppercase tracking-[0.2em] transition-colors ${
                    pathname === link.href ? 'text-electric-yellow' : 'text-slate-300'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px w-full max-w-xs bg-white/10 my-4" />
              {isAuthenticated ? (
                <>
                  <Link href="/cuenta" className="text-sm font-semibold uppercase tracking-[0.2em] text-electric-yellow">
                    Mi cuenta
                  </Link>
                  <Link href="/cuenta/configuracion" className="text-sm text-slate-400">
                    Configuración
                  </Link>
                </>
              ) : (
                <>
                  <Link href={accountHref} className="text-sm font-semibold uppercase tracking-[0.2em] text-electric-yellow">
                    {accountLabel}
                  </Link>
                  <Link href="/register" className="text-sm text-slate-400">
                    Crear cuenta
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
