import type { Metadata } from 'next'
import { Montserrat, Playfair_Display } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'
import ScrollProvider from '@/components/ScrollProvider'
import Providers from '@/components/Providers'
import AgeGateModal from '@/components/AgeGateModal'
import CookieBanner from '@/components/CookieBanner'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import DevEnvironmentBanner from '@/components/DevEnvironmentBanner'
import { cn } from "@/lib/utils";

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
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
    <html lang="es" className={cn(montserrat.variable, playfair.variable, montserrat.className, "dark font-sans")}>
      <body className="min-h-screen bg-night text-white antialiased">
        <Providers>
          <AgeGateModal />
          <ScrollProvider>
            <Header />
            <CookieBanner />
            {children}
            <Footer />
            <DevEnvironmentBanner />
          </ScrollProvider>
        </Providers>
      </body>
    </html>
  )
}
