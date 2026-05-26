'use client'

import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
    >
      Cerrar Sesión
    </button>
  )
}
