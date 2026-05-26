'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ConsentState = 'unknown' | 'accepted' | 'declined'

const COOKIE_NAME = 'vermut_age_verified'

function readAgeCookie(): ConsentState {
  if (typeof document === 'undefined') return 'unknown'
  const match = document.cookie.match(new RegExp('(^| )' + COOKIE_NAME + '=([^;]+)'))
  if (!match) return 'unknown'
  return match[2] === '1' ? 'accepted' : 'declined'
}

function writeAgeCookie(value: ConsentState) {
  if (typeof document === 'undefined') return
  const maxAge = 60 * 60 * 24 * 365
  document.cookie = `${COOKIE_NAME}=${value === 'accepted' ? '1' : '0'}; path=/; max-age=${maxAge}; sameSite=Lax`
}

export default function AgeGateModal() {
  const [consent, setConsent] = useState<ConsentState>('unknown')
  const [visible, setVisible] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = readAgeCookie()
    setConsent(stored)
    setVisible(stored === 'unknown')
  }, [])

  useEffect(() => {
    if (visible && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
      
      firstElement?.focus()

      const handleTab = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault()
              lastElement?.focus()
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault()
              firstElement?.focus()
            }
          }
        }
      }

      document.addEventListener('keydown', handleTab)
      return () => document.removeEventListener('keydown', handleTab)
    }
  }, [visible])

  const handleAccept = () => {
    writeAgeCookie('accepted')
    setConsent('accepted')
    setVisible(false)
  }

  const handleDecline = () => {
    writeAgeCookie('declined')
    setConsent('declined')
    window.location.href = 'https://www.disney.com'
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/90 backdrop-blur-xl p-6 text-white"
          role="dialog"
          aria-modal="true"
          aria-labelledby="age-gate-title"
          aria-describedby="age-gate-description"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="mx-auto max-w-xl w-full rounded-[2.5rem] border border-electric-yellow/20 bg-[#111111]/95 p-10 shadow-neon"
          >
            <div className="space-y-6 text-center">
              <span className="inline-flex rounded-full border border-electric-yellow/20 bg-electric-yellow/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-electric-yellow">
                Control de acceso
              </span>
              <h2 id="age-gate-title" className="text-4xl font-display tracking-tight text-white">¿Eres mayor de 18 años?</h2>
              <p id="age-gate-description" className="text-base leading-7 text-slate-300">
                La venta de bebidas alcohólicas en España está regulada. Debes tener 18 años o más para entrar en nuestra web y ver nuestro contenido canalla.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-4">
                <button 
                  onClick={handleAccept}
                  className="rounded-full bg-electric-yellow px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-black transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,204,0,0.3)] focus:outline-none focus:ring-2 focus:ring-electric-yellow focus:ring-offset-2 focus:ring-offset-[#111111]"
                >
                  Sí, tengo 18+
                </button>
                <button 
                  onClick={handleDecline} 
                  className="rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:border-electric-yellow/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#111111]"
                >
                  No, salir
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
