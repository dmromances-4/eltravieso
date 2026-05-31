import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'
import ScrollProvider from '@/components/ScrollProvider'
import Providers from '@/components/Providers'
import AgeGateModal from '@/components/AgeGateModal'
import CookieBanner from '@/components/CookieBanner'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
})

export const metadata: Metadata = {
  title: 'Vermut El Travieso',
  description: 'Brutalismo refinado para vermut premium con espíritu canalla.',
  icons: {
    icon: '/favicon.ico'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${montserrat.variable} ${montserrat.className}`}>
      <body className="min-h-screen bg-night text-white antialiased">
        <Providers>
          <AgeGateModal />
          <ScrollProvider>
            <Header />
            <CookieBanner />
            {children}
            <Footer />
          </ScrollProvider>
        </Providers>
      </body>
    </html>
  )
}
