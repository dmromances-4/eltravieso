import { getTranslations } from "next-intl/server";
import CheckoutForm from "@/components/CheckoutForm";
import { isStripeConfigured } from "@/lib/stripe/api";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: { locale: AppLocale } };

export default async function CheckoutPage({ params }: Props) {
  const paymentsEnabled = isStripeConfigured();
  const t = await getTranslations({ locale: params.locale, namespace: "checkout" });

  return (
    <main className="min-h-screen bg-night px-4 py-12 text-white sm:px-8 md:py-16">
      <div className="mx-auto max-w-5xl space-y-8 md:space-y-10">
        <div className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-6 shadow-neon md:p-10">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.35em] text-electric-yellow">{t("title")}</p>
            <h1 className="font-display text-3xl text-white md:text-4xl">{t("title")}</h1>
          </div>
          <div className="mt-8 md:mt-12">
            <CheckoutForm paymentsEnabled={paymentsEnabled} />
          </div>
        </div>
      </div>
    </main>
  );
}
