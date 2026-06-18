'use client'

import { signIn, useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { BrandButton } from '@/components/ui/BrandButton'
import { PageHero } from '@/components/ui/PageHero'

function LoginForm() {
  const t = useTranslations('auth')
  const tErrors = useTranslations('errors')
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
    if (needs2faParam) setNeeds2fa(true)
  }, [needs2faParam])

  useEffect(() => {
    if (status === 'authenticated') router.replace(callbackUrl)
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
      if (res.error.includes('2FA')) {
        setNeeds2fa(true)
        setError(needs2fa ? '2FA' : '2FA required')
      } else {
        setError(res.error === 'CredentialsSignin' ? tErrors('invalidCredentials') : res.error)
      }
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-[#0A0A0A] px-6 py-12 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,209,66,0.08),transparent_45%)]" />
      <div className="relative mx-auto w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="font-display text-2xl font-semibold text-white transition-colors hover:text-electric-yellow">
            El Travieso
          </Link>
          <div className="mt-8 space-y-3">
            <PageHero compact eyebrow={t('loginTitle')} title={t('loginTitle')} />
            <p className="text-sm text-slate-400">
              {t('noAccount')}{' '}
              <Link href="/register" className="font-medium text-electric-blue hover:text-white">
                {t('registerButton')}
              </Link>
            </p>
          </div>
        </div>

        <div className="rounded-card border border-white/10 bg-[var(--surface-panel)] p-8 sm:p-10">
          {isAdminLogin ? (
            <div className="mb-6 rounded-card border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              {t('adminLoginRequired')}
            </div>
          ) : null}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error ? (
              <div className="rounded-card border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
            ) : null}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">{t('email')}</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 block w-full min-h-[44px] rounded-pill border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white sm:text-sm" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">{t('password')}</label>
              <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 block w-full min-h-[44px] rounded-pill border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white sm:text-sm" />
            </div>

            {needs2fa ? (
              <div>
                <label htmlFor="token2fa" className="block text-sm font-medium text-slate-300">2FA</label>
                <input id="token2fa" type="text" inputMode="numeric" required value={token2fa} onChange={(e) => setToken2fa(e.target.value)} className="mt-2 block w-full min-h-[44px] rounded-pill border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white sm:text-sm" />
              </div>
            ) : null}

            <BrandButton type="submit" disabled={loading} className="min-h-[44px] w-full">
              {loading ? t('loginButton') + '…' : t('loginButton')}
            </BrandButton>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]" />}>
      <LoginForm />
    </Suspense>
  )
}
