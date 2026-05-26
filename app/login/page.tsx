'use client'

import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false
    })

    setLoading(false)

    if (res?.error) {
      setError('Credenciales inválidas')
    } else {
      const callbackUrl = searchParams?.get('callbackUrl') || '/'
      router.push(callbackUrl)
      router.refresh()
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] flex flex-col justify-center px-6 py-12 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,204,0,0.1),_transparent_35%)]" />
      
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="group mx-auto flex w-max items-center justify-center gap-2 mb-8 text-white transition-colors hover:text-electric-yellow">
          <span className="font-display text-3xl font-bold tracking-tighter">EL TRAVIESO</span>
        </Link>
        <h2 className="text-center text-2xl font-bold tracking-tight text-white mb-2">Entra a tu cuenta</h2>
        <p className="text-center text-sm text-slate-400">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="font-semibold text-electric-yellow transition-colors hover:text-white">
            Regístrate aquí
          </Link>
        </p>
      </div>

      <div className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-[2.5rem] border border-white/10 bg-[#121212]/90 p-8 shadow-neon backdrop-blur-xl sm:p-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 animate-[shake_0.5s_ease-in-out]">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
                Email
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full rounded-full border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white placeholder-slate-600 transition-all focus:border-electric-yellow focus:outline-none focus:ring-1 focus:ring-electric-yellow sm:text-sm"
                  placeholder="tucorreo@ejemplo.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
                Contraseña
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full rounded-full border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white placeholder-slate-600 transition-all focus:border-electric-yellow focus:outline-none focus:ring-1 focus:ring-electric-yellow sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-full bg-electric-yellow px-5 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-black transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,204,0,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Iniciando sesión...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-electric-yellow border-t-transparent animate-spin"></div></div>}>
      <LoginForm />
    </Suspense>
  )
}
