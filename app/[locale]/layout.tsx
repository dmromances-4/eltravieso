import type { Metadata, Viewport } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import ScrollProvider from "@/components/ScrollProvider";
import Providers from "@/components/Providers";
import AgeGateModal from "@/components/AgeGateModal";
import CookieBanner from "@/components/CookieBanner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DevEnvironmentBanner from "@/components/DevEnvironmentBanner";
import CapacitorShell from "@/components/CapacitorShell";
import { cn } from "@/lib/utils";
import { routing, type AppLocale } from "@/i18n/routing";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

type Props = {
  children: ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = params.locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
    icons: {
      icon: "/icons/icon-192.png",
      apple: "/icons/apple-touch-icon.png",
    },
    alternates: {
      languages: {
        es: "/",
        en: "/en",
      },
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default async function LocaleLayout({ children, params }: Props) {
  const locale = params.locale as AppLocale;
  if (!routing.locales.includes(locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={cn(
        montserrat.variable,
        playfair.variable,
        montserrat.className,
        "dark font-sans",
      )}
    >
      <body className="min-h-screen bg-night pb-[env(safe-area-inset-bottom)] text-white antialiased pt-[env(safe-area-inset-top)]">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <AgeGateModal />
            <ScrollProvider>
              <Header />
              <CookieBanner />
              {children}
              <Footer />
              <CapacitorShell />
              <DevEnvironmentBanner />
            </ScrollProvider>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
