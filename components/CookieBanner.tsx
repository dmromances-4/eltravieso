'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ConsentState = 'unknown' | 'accepted' | 'rejected'

type CookieConsent = {
  essential: true
  preferences: boolean
  analytics: boolean
  marketing: boolean
}

const COOKIE_NAME = 'vermut_cookie_consent'

function readCookieConsent(): ConsentState {
  if (typeof document === 'undefined') return 'unknown'
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`))
  if (!match) return 'unknown'
  return match[2] === 'accepted' ? 'accepted' : match[2] === 'rejected' ? 'rejected' : 'unknown'
}

function writeCookieConsent(state: ConsentState, consent?: CookieConsent) {
  if (typeof document === 'undefined') return
  const maxAge = 60 * 60 * 24 * 365
  const value = state === 'accepted' ? 'accepted' : 'rejected'
  const data = consent ? JSON.stringify(consent) : value
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(data)}; path=/; max-age=${maxAge}; sameSite=Lax`
}

export default function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState>('unknown')
  const [openConfig, setOpenConfig] = useState(false)
  const [preferences, setPreferences] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const stored = readCookieConsent()
    setConsent(stored)
  }, [])

  useEffect(() => {
    if (consent !== 'unknown') {
      document.body.classList.remove('pb-cookie-safe')
      return
    }
    document.body.classList.add('pb-cookie-safe')
    return () => document.body.classList.remove('pb-cookie-safe')
  }, [consent])

  const handleAcceptAll = () => {
    writeCookieConsent('accepted', {
      essential: true,
      preferences: true,
      analytics: true,
      marketing: true
    })
    setConsent('accepted')
  }

  const handleReject = () => {
    writeCookieConsent('rejected', {
      essential: true,
      preferences: false,
      analytics: false,
      marketing: false
    })
    setConsent('rejected')
  }

  const handleSaveConfig = () => {
    writeCookieConsent('accepted', {
      essential: true,
      preferences,
      analytics,
      marketing
    })
    setConsent('accepted')
  }

  return (
    <AnimatePresence>
      {consent === 'unknown' && (
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0A0A0A]/95 px-6 py-6 text-white shadow-[0_-12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:px-10"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4 lg:max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg">🍪</span>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-electric-yellow">Cookies & Privacidad</p>
              </div>
              <p className="text-sm leading-6 text-slate-300">
                Este sitio utiliza cookies necesarias para el carrito y preferencias. Puedes aceptar todas, rechazar las opcionales o configurar tus preferencias detalladas para una experiencia a medida.
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                <span className="rounded-full border border-white/10 px-2 py-1">Legal España</span>
                <span className="rounded-full border border-white/10 px-2 py-1">18+</span>
                <span className="rounded-full border border-white/10 px-2 py-1">RGPD</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:items-end">
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={handleReject} 
                  className="rounded-full border border-white/20 bg-transparent px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/5"
                >
                  Rechazar
                </button>
                <button 
                  onClick={() => setOpenConfig((value) => !value)} 
                  className="rounded-full border border-electric-yellow bg-electric-yellow/5 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-electric-yellow transition-colors hover:bg-electric-yellow/10"
                >
                  Configurar
                </button>
                <button 
                  onClick={handleAcceptAll} 
                  className="rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black transition-all hover:brightness-110 hover:shadow-neon-glow"
                >
                  Aceptar todo
                </button>
              </div>
              
              <AnimatePresence>
                {openConfig && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="w-full max-w-xl overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#141414] shadow-xl"
                  >
                    <div className="p-5 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-white mb-4 border-b border-white/10 pb-2">Preferencias de cookies</p>
                      
                      <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#0f0f0f] p-4 border border-white/5">
                        <div>
                          <span className="block text-sm font-medium text-white">Preferencias</span>
                          <span className="block text-xs text-slate-500 mt-1">Guarda tu idioma y ajustes de interfaz</span>
                        </div>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                          <input type="checkbox" name="toggle" id="toggle-pref" checked={preferences} onChange={(e) => setPreferences(e.target.checked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                          <label htmlFor="toggle-pref" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#0f0f0f] p-4 border border-white/5">
                        <div>
                          <span className="block text-sm font-medium text-white">Analíticas</span>
                          <span className="block text-xs text-slate-500 mt-1">Nos ayuda a mejorar entendiendo cómo usas la web</span>
                        </div>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                          <input type="checkbox" name="toggle" id="toggle-analytics" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                          <label htmlFor="toggle-analytics" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#0f0f0f] p-4 border border-white/5">
                        <div>
                          <span className="block text-sm font-medium text-white">Marketing</span>
                          <span className="block text-xs text-slate-500 mt-1">Cookies para campañas y anuncios personalizados</span>
                        </div>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                          <input type="checkbox" name="toggle" id="toggle-marketing" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                          <label htmlFor="toggle-marketing" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                      </div>

                      <button onClick={handleSaveConfig} className="mt-4 w-full rounded-full bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-slate-200">
                        Guardar mis preferencias
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
