"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

type ConsentState = "unknown" | "accepted" | "declined";

const STORAGE_KEY = "vermut_age_verified";
const COOKIE_NAME = "vermut_age_verified";
const EXIT_URL = "https://www.google.com";

function readAgeState(): ConsentState {
  if (typeof window === "undefined") return "unknown";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "accepted" || stored === "declined") {
    return stored;
  }

  const cookieMatch = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
  if (!cookieMatch) return "unknown";
  return cookieMatch[2] === "1" ? "accepted" : "declined";
}

function writeAgeState(value: ConsentState) {
  if (typeof window === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  window.localStorage.setItem(STORAGE_KEY, value);
  document.cookie = `${COOKIE_NAME}=${value === "accepted" ? "1" : "0"}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export default function AgeGateModal() {
  const t = useTranslations("ageGate");
  const [consent, setConsent] = useState<ConsentState>("unknown");
  const [visible, setVisible] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = readAgeState();
    setConsent(stored);

    if (stored === "unknown") {
      setVisible(true);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }

    if (stored === "declined") {
      setBlocked(true);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }

    setVisible(false);
    setBlocked(false);
  }, []);

  useEffect(() => {
    if (!visible || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    firstElement?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [visible]);

  const handleAccept = () => {
    writeAgeState("accepted");
    setConsent("accepted");
    setVisible(false);
    setBlocked(false);
    document.body.style.overflow = "";
  };

  const handleDecline = () => {
    writeAgeState("declined");
    setConsent("declined");
    setVisible(false);
    setBlocked(true);
    window.location.href = EXIT_URL;
  };

  if (consent === "accepted") {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/95 p-6 text-white backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="age-gate-title"
            aria-describedby="age-gate-description"
          >
            <motion.div
              ref={modalRef}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="mx-auto w-full max-w-xl rounded-[2.5rem] border border-electric-yellow/20 bg-[#111111]/95 p-10 shadow-neon"
            >
              <div className="space-y-6 text-center">
                <h2 id="age-gate-title" className="font-display text-4xl tracking-tight text-white">
                  {t("title")}
                </h2>
                <p id="age-gate-description" className="text-base leading-7 text-slate-300">
                  {t("description")}
                </p>
                <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={handleAccept}
                    className="min-h-[44px] rounded-full bg-electric-yellow px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-black transition-all hover:brightness-110"
                  >
                    {t("confirm")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDecline}
                    className="min-h-[44px] rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:border-electric-yellow/40 hover:bg-white/10"
                  >
                    {t("deny")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {blocked && !visible ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] p-6 text-center text-white">
          <div className="max-w-md space-y-4">
            <h2 className="font-display text-2xl font-bold">{t("blockedTitle")}</h2>
            <p className="text-slate-400">{t("blockedBody")}</p>
            <button
              type="button"
              onClick={() => {
                document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
                window.location.reload();
              }}
              className="min-h-[44px] rounded-full border border-white/20 px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-300"
            >
              {t("retry")}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
