'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function CartWidget() {
  const pathname = usePathname()
  
  // Hide on cart and checkout pages
  if (pathname === '/cart' || pathname === '/checkout') {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5, type: 'spring' }}
      className="fixed bottom-6 right-6 z-40 flex rounded-full border border-electric-yellow/30 bg-[#121212]/95 p-3 shadow-[0_0_30px_rgba(249,209,66,0.2)] backdrop-blur-md sm:bottom-8 sm:right-8 sm:p-4"
    >
      <Link href="/cart" className="group inline-flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors hover:text-electric-yellow">
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-electric-yellow text-black transition-transform group-hover:scale-110 sm:h-12 sm:w-12">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:h-6 sm:w-6"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-electric-red text-[10px] font-bold text-white outline outline-2 outline-[#121212]">
            2
          </span>
        </span>
        <span className="hidden pr-2 sm:inline-block">Carrito</span>
      </Link>
    </motion.div>
  )
}
