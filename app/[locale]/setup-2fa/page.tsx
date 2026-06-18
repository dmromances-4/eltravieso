"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { signOut } from "next-auth/react";

type TwoFactorStatus = {
  isTwoFactorEnabled: boolean;
  hasSecret: boolean;
  role?: string;
  adminRequires2fa?: boolean;
};

function Setup2FAContent() {
  const t = useTranslations("setup2fa");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const requireAdmin = searchParams.get("require") === "admin";
  const callbackUrl = searchParams.get("callbackUrl") || (requireAdmin ? "/admin" : "/cuenta/seguridad");

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    async function fetchStatus() {
      setStatusLoading(true);
      setStatusError("");

      try {
        const res = await fetch("/api/auth/setup-2fa");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || t("unauthorized"));
        }

        setStatus(data);
      } catch (err: unknown) {
        setStatusError(err instanceof Error ? err.message : t("loadError"));
      } finally {
        setStatusLoading(false);
      }
    }

    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once on mount
  }, []);

  const generateSecret = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/setup-2fa", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t("generateError"));
      setQrCode(data.qrCodeUrl);
      setSecret(data.secret);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tCommon("error"));
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/setup-2fa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t("verifyError"));

      setMessage(t("enabledSuccess"));

      await signOut({ redirect: false });

      setTimeout(() => {
        const login = new URL("/login", window.location.origin);
        login.searchParams.set("callbackUrl", callbackUrl);
        if (requireAdmin || data.role === "ADMIN") {
          login.searchParams.set("admin", "1");
        }
        router.push(`${login.pathname}${login.search}`);
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tCommon("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-4 py-16">
      <div className="max-w-lg w-full rounded-[2rem] border border-white/10 bg-[#121212]/95 p-8 shadow-neon">
        <h2 className="text-3xl font-display font-bold text-white mb-2 text-center">{t("title")}</h2>

        {requireAdmin ? (
          <p className="mb-6 text-center text-sm text-amber-200/90">{t("adminRequired")}</p>
        ) : (
          <p className="mb-6 text-center text-sm text-slate-400">{t("subtitle")}</p>
        )}

        {statusLoading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-slate-300">
            {t("loadingStatus")}
          </div>
        ) : statusError ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400">{statusError}</div>
            <div className="text-center">
              <Link href="/login" className="text-electric-yellow font-semibold hover:text-white">
                {t("goToLogin")}
              </Link>
            </div>
          </div>
        ) : status?.isTwoFactorEnabled ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-emerald-300">
              {t("alreadyEnabled")}
            </div>
            <div className="text-center">
              <Link
                href={callbackUrl}
                className="inline-flex rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black"
              >
                {t("continue")}
              </Link>
            </div>
          </div>
        ) : (
          <>
            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 mb-6">{error}</div>
            ) : null}
            {message ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-300 mb-6">{message}</div>
            ) : null}

            {!qrCode ? (
              <div className="text-center">
                <button
                  type="button"
                  onClick={generateSecret}
                  disabled={loading}
                  className="rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black hover:brightness-110 disabled:opacity-60"
                >
                  {loading ? t("generating") : status?.hasSecret ? t("restartSetup") : t("beginSetup")}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-slate-400 mb-4 text-center text-sm">{t("scanQr")}</p>
                <div className="bg-white p-4 rounded-xl mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt={t("qrAlt")} className="w-48 h-48" />
                </div>
                <p className="text-slate-400 mb-4 text-center text-sm">{t("enterCode")}</p>
                <form onSubmit={verifyToken} className="w-full flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 rounded-full border border-white/10 bg-[#0f0f0f] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
                    placeholder="123456"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-full bg-electric-red text-white font-bold py-3 px-6 text-xs uppercase tracking-widest hover:brightness-110 disabled:opacity-60"
                  >
                    {t("verify")}
                  </button>
                </form>
                {secret ? (
                  <p className="text-slate-500 mt-4 text-xs text-center">
                    {t("manualCode")} <span className="text-white font-mono">{secret}</span>
                  </p>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Setup2FALoading() {
  const tCommon = useTranslations("common");
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-slate-400">
      {tCommon("loading")}
    </div>
  );
}

export default function Setup2FAPage() {
  return (
    <Suspense fallback={<Setup2FALoading />}>
      <Setup2FAContent />
    </Suspense>
  );
}
