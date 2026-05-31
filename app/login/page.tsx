'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token2fa, setToken2fa] = useState('')
  const [needs2fa, setNeeds2fa] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const registered = searchParams?.get('registered') === 'true'
  const isAdminLogin = searchParams?.get('admin') === '1'
  const needs2faParam = searchParams?.get('error') === '2fa'
  const callbackUrl = searchParams?.get('callbackUrl') || '/cuenta'

  useEffect(() => {
    if (needs2faParam) {
      setNeeds2fa(true)
    }
  }, [needs2faParam])

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl)
    }
  }, [status, router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await signIn('credentials', {
      email,
      password,
      token2fa: needs2fa ? token2fa : '',
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      if (res.error.includes('2FA') || res.error === 'Se requiere código 2FA.') {
        setNeeds2fa(true)
        setError(needs2fa ? 'Código 2FA incorrecto.' : 'Introduce el código de tu app autenticadora.')
      } else {
        setError(res.error === 'CredentialsSignin' ? 'Email o contraseña incorrectos.' : res.error)
      }
      return
    }

    router.push(callbackUrl)
    router.refresh()
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
            Regístrate gratis
          </Link>
        </p>
      </div>

      <div className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-[2.5rem] border border-white/10 bg-[#121212]/90 p-8 shadow-neon backdrop-blur-xl sm:p-10">
          {registered ? (
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              Cuenta creada. Inicia sesión con tu email y contraseña.
            </div>
          ) : null}

          {isAdminLogin ? (
            <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              <p className="font-semibold text-amber-200">Acceso al panel de administración</p>
              <p className="mt-1 text-amber-100/90">
                Debes tener 2FA activo e introducir el código de tu app autenticadora al iniciar sesión.
              </p>
            </div>
          ) : null}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 block w-full rounded-full border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white placeholder-slate-600 focus:border-electric-yellow focus:outline-none focus:ring-1 focus:ring-electric-yellow sm:text-sm"
                placeholder="tucorreo@ejemplo.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 block w-full rounded-full border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white placeholder-slate-600 focus:border-electric-yellow focus:outline-none focus:ring-1 focus:ring-electric-yellow sm:text-sm"
                placeholder="••••••••"
              />
            </div>

            {needs2fa ? (
              <div>
                <label htmlFor="token2fa" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
                  Código 2FA
                </label>
                <input
                  id="token2fa"
                  type="text"
                  inputMode="numeric"
                  required
                  value={token2fa}
                  onChange={(e) => setToken2fa(e.target.value)}
                  className="mt-2 block w-full rounded-full border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white focus:border-electric-yellow focus:outline-none sm:text-sm"
                  placeholder="123456"
                />
                <p className="mt-2 text-xs text-slate-500">Código de 6 dígitos de Google Authenticator.</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-full bg-electric-yellow px-5 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Iniciando sesión…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-electric-yellow border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
