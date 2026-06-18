"use client";

import { Link } from "@/i18n/navigation";
import { useEffect, useState, type FormEvent } from "react";

type TwoFactorStatus = {
  isTwoFactorEnabled: boolean;
  hasSecret: boolean;
  role?: string;
  adminRequires2fa?: boolean;
};

export default function TwoFactorSettings() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disablePassword, setDisablePassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/setup-2fa");
      const data = await res.json();
      if (res.ok) setStatus(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleDisable = async (e: FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/setup-2fa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo desactivar 2FA");

      setMessage(data.message);
      setDisablePassword("");
      await loadStatus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-400">Cargando estado de seguridad…</p>;
  }

  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Autenticación en dos pasos</p>
        <p className="mt-2 text-white">
          {status?.isTwoFactorEnabled ? "Activada" : status?.hasSecret ? "Pendiente de verificación" : "Desactivada"}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Protege tu cuenta con un código adicional al iniciar sesión (Google Authenticator).
        </p>
        {status?.adminRequires2fa ? (
          <p className="mt-3 text-sm text-amber-200/90">
            Como administrador, el 2FA es obligatorio para acceder al panel de ventas y clientes.
          </p>
        ) : null}
      </div>

      {status?.isTwoFactorEnabled ? (
        status?.adminRequires2fa ? (
          <p className="text-sm text-slate-400 rounded-2xl border border-white/10 p-4">
            No puedes desactivar 2FA en una cuenta de administración.
          </p>
        ) : (
        <form onSubmit={handleDisable} className="space-y-4 rounded-2xl border border-white/10 p-5">
          <p className="text-sm text-slate-300">Para desactivar 2FA, confirma tu contraseña:</p>
          <input
            type="password"
            required
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            className="block w-full rounded-full border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white sm:text-sm"
            placeholder="Tu contraseña"
          />
          <button
            type="submit"
            disabled={actionLoading}
            className="rounded-full border border-red-500/40 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-red-400 hover:bg-red-500/10 disabled:opacity-60"
          >
            {actionLoading ? "Procesando…" : "Desactivar 2FA"}
          </button>
        </form>
        )
      ) : (
        <Link
          href="/setup-2fa"
          className="inline-flex rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black hover:brightness-110"
        >
          Configurar 2FA
        </Link>
      )}
    </div>
  );
}
