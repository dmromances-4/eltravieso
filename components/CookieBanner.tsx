"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

type ConsentState = "unknown" | "accepted" | "rejected";

type CookieConsent = {
  essential: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
};

const COOKIE_NAME = "vermut_cookie_consent";

function readCookieConsent(): ConsentState {
  if (typeof document === "undefined") return "unknown";
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
  if (!match) return "unknown";
  return match[2] === "accepted" ? "accepted" : match[2] === "rejected" ? "rejected" : "unknown";
}

function writeCookieConsent(state: ConsentState, consent?: CookieConsent) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  const value = state === "accepted" ? "accepted" : "rejected";
  const data = consent ? JSON.stringify(consent) : value;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(data)}; path=/; max-age=${maxAge}; sameSite=Lax`;
}

export default function CookieBanner() {
  const t = useTranslations("cookies");
  const tCommon = useTranslations("common");
  const [consent, setConsent] = useState<ConsentState>("unknown");
  const [openConfig, setOpenConfig] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = readCookieConsent();
    setConsent(stored);
  }, []);

  useEffect(() => {
    if (consent !== 'unknown') {
      document.body.classList.remove('pb-cookie-safe')
      return
    }
    document.body.classList.add('pb-cookie-safe')
    return () => document.body.classList.remove('pb-cookie-safe')
  }, [consent])

  const handleAcceptAll = () => {
    writeCookieConsent("accepted", {
      essential: true,
      preferences: true,
      analytics: true,
      marketing: true,
    });
    setConsent("accepted");
  };

  const handleReject = () => {
    writeCookieConsent("rejected", {
      essential: true,
      preferences: false,
      analytics: false,
      marketing: false,
    });
    setConsent("rejected");
  };

  const handleSaveConfig = () => {
    writeCookieConsent("accepted", {
      essential: true,
      preferences,
      analytics,
      marketing,
    });
    setConsent("accepted");
  };

  return (
    <AnimatePresence>
      {consent === "unknown" && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0A0A0A]/95 px-6 py-6 text-white shadow-[0_-12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:px-10"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4 lg:max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-electric-yellow">{t("title")}</p>
              <p className="text-sm leading-6 text-slate-300">{t("description")}</p>
            </div>

            <div className="flex flex-col gap-4 lg:items-end">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleReject}
                  className="min-h-[44px] rounded-full border border-white/20 bg-transparent px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/5"
                >
                  {t("reject")}
                </button>
                <button
                  onClick={() => setOpenConfig((value) => !value)}
                  className="min-h-[44px] rounded-full border border-electric-yellow bg-electric-yellow/5 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-electric-yellow transition-colors hover:bg-electric-yellow/10"
                >
                  {t("preferences")}
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="min-h-[44px] rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black transition-all hover:brightness-110"
                >
                  {t("accept")}
                </button>
              </div>

              <AnimatePresence>
                {openConfig && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="w-full max-w-xl overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#141414] shadow-xl"
                  >
                    <div className="space-y-3 p-5">
                      <p className="mb-4 border-b border-white/10 pb-2 text-xs font-bold uppercase tracking-widest text-white">
                        {t("preferencesTitle")}
                      </p>

                      <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-[#0f0f0f] p-4">
                        <div>
                          <span className="block text-sm font-medium text-white">{t("prefLabel")}</span>
                          <span className="mt-1 block text-xs text-slate-500">{t("prefHint")}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences}
                          onChange={(e) => setPreferences(e.target.checked)}
                          className="h-5 w-5 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-[#0f0f0f] p-4">
                        <div>
                          <span className="block text-sm font-medium text-white">{t("analyticsLabel")}</span>
                          <span className="mt-1 block text-xs text-slate-500">{t("analyticsHint")}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={analytics}
                          onChange={(e) => setAnalytics(e.target.checked)}
                          className="h-5 w-5 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-[#0f0f0f] p-4">
                        <div>
                          <span className="block text-sm font-medium text-white">{t("marketingLabel")}</span>
                          <span className="mt-1 block text-xs text-slate-500">{t("marketingHint")}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={marketing}
                          onChange={(e) => setMarketing(e.target.checked)}
                          className="h-5 w-5 rounded"
                        />
                      </label>

                      <button
                        onClick={handleSaveConfig}
                        className="mt-4 min-h-[44px] w-full rounded-full bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-slate-200"
                      >
                        {tCommon("save")}
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
  );
}
