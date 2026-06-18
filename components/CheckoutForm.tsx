"use client";

import { ChangeEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart/CartContext";
import { useAppLocale } from "@/lib/i18n/use-app-locale";
import { formatCurrency } from "@/lib/i18n/format";

export default function CheckoutForm({ paymentsEnabled = true }: { paymentsEnabled?: boolean }) {
  const { items, subtotalCents, clear } = useCart();
  const [email, setEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const t = useTranslations("checkoutForm");
  const tCart = useTranslations("cart");
  const tCheckout = useTranslations("checkout");
  const tCommon = useTranslations("common");
  const locale = useAppLocale();

  const total = subtotalCents;

  const handleCheckout = async () => {
    setError(null);
    if (items.length === 0) {
      setError(t("emptyCart"));
      return;
    }
    if (!email || !acceptedTerms || !acceptedPrivacy) {
      setError(t("validationError"));
      return;
    }
    setLoading(true);

    const payloadItems = items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
    }));

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, items: payloadItems }),
      });
      const payload = await response.json();
      if (payload.url) {
        clear();
        window.location.href = payload.url;
      } else {
        setError(payload.message ?? payload.error ?? tCommon("error"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("error"));
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="space-y-6 rounded-[2.5rem] border border-white/10 bg-[#111111]/90 p-8 text-center shadow-neon backdrop-blur-xl md:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <span className="text-3xl">🛒</span>
        </div>
        <h2 className="text-2xl font-display text-white">{t("emptyCart")}</h2>
        <p className="text-sm text-slate-400">{t("emptyHint")}</p>
        <Link
          href="/shop"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-electric-yellow px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-black transition-all hover:brightness-110"
        >
          {t("goShop")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 rounded-[2.5rem] border border-white/10 bg-[#111111]/90 p-6 shadow-neon backdrop-blur-xl md:grid md:grid-cols-[1fr_340px] md:gap-8 md:p-8">
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-3xl font-display font-bold tracking-tight text-white">{t("title")}</h2>
          <p className="text-sm leading-7 text-slate-300">
            {paymentsEnabled ? t("reviewHint") : t("demoMode")}
          </p>
        </div>

        {!paymentsEnabled ? (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {t("demoMode")}
          </div>
        ) : null}

        <div className="grid gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-3xl border border-white/5 bg-[#0f0f0f]/80 p-5"
            >
              <div>
                <p className="text-lg font-bold text-white">{item.name}</p>
                <p className="mt-1 text-sm text-slate-400">{item.description}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-electric-yellow">
                  {formatCurrency(item.amount * item.quantity, locale)}
                </span>
                <p className="mt-1 text-xs text-slate-500">
                  {tCart("quantity")}: {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6 rounded-3xl border border-white/10 bg-[#161616] p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("orderSummary")}</p>
        <div className="flex items-center justify-between border-b border-white/10 pb-4 text-sm text-slate-400">
          <span className="text-xs font-bold uppercase tracking-widest">{tCart("total")}</span>
          <span className="text-2xl font-bold text-white">{formatCurrency(total, locale)}</span>
        </div>

        <div className="space-y-4 pt-2">
          <label className="group flex cursor-pointer items-start gap-4 text-sm text-slate-300">
            <div className="relative mt-0.5 flex items-center justify-center">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setAcceptedTerms(event.target.checked)}
                className="peer h-5 w-5 appearance-none rounded border border-white/20 bg-[#0f0f0f] transition-all checked:border-electric-yellow checked:bg-electric-yellow focus:outline-none focus:ring-2 focus:ring-electric-yellow focus:ring-offset-2 focus:ring-offset-[#161616]"
              />
              <svg
                className="pointer-events-none absolute h-3 w-3 text-black opacity-0 peer-checked:opacity-100"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="leading-6">
              {t("acceptTerms")}{" "}
              <Link href="/terminos-y-condiciones" className="border-b border-white/30 text-white hover:border-electric-yellow hover:text-electric-yellow">
                →
              </Link>
            </span>
          </label>
          <label className="group flex cursor-pointer items-start gap-4 text-sm text-slate-300">
            <div className="relative mt-0.5 flex items-center justify-center">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setAcceptedPrivacy(event.target.checked)}
                className="peer h-5 w-5 appearance-none rounded border border-white/20 bg-[#0f0f0f] transition-all checked:border-electric-yellow checked:bg-electric-yellow focus:outline-none focus:ring-2 focus:ring-electric-yellow focus:ring-offset-2 focus:ring-offset-[#161616]"
              />
              <svg
                className="pointer-events-none absolute h-3 w-3 text-black opacity-0 peer-checked:opacity-100"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="leading-6">
              {t("acceptPrivacy")}{" "}
              <Link href="/politica-privacidad" className="border-b border-white/30 text-white hover:border-electric-yellow hover:text-electric-yellow">
                →
              </Link>
            </span>
          </label>
        </div>

        <div className="pt-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-300">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">{t("email")}</span>
            <input
              type="email"
              value={email}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
              placeholder="cliente@ejemplo.com"
              className="w-full rounded-full border border-white/10 bg-[#0f0f0f] px-4 py-3.5 text-white outline-none transition-all placeholder:text-slate-600 focus:border-electric-yellow focus:ring-1 focus:ring-electric-yellow"
            />
          </label>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          disabled={loading || !paymentsEnabled}
          onClick={handleCheckout}
          className="group relative flex min-h-[44px] w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-electric-yellow px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-black transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(249,209,66,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? tCheckout("processing") : paymentsEnabled ? t("payStripe") : t("demoMode")}
        </button>
      </div>
    </div>
  );
}
