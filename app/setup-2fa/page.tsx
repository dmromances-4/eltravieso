"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TwoFactorStatus = {
  isTwoFactorEnabled: boolean;
  hasSecret: boolean;
};

export default function Setup2FAPage() {
  const router = useRouter();
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
          throw new Error(data.message || "No autorizado");
        }

        setStatus(data);
      } catch (err: any) {
        setStatusError(err.message);
      } finally {
        setStatusLoading(false);
      }
    }

    fetchStatus();
  }, []);

  const generateSecret = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/setup-2fa", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al generar secreto");
      setQrCode(data.qrCodeUrl);
      setSecret(data.secret);
    } catch (err: any) {
      setError(err.message);
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
      if (!res.ok) throw new Error(data.message || "Error al validar token");

      setMessage("¡2FA activado con éxito!");
      setTimeout(() => router.push("/"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Configurar 2FA</h2>

        {statusLoading ? (
          <div className="bg-zinc-800 border border-zinc-700 text-zinc-300 px-4 py-3 rounded mb-6 text-center">
            Cargando estado de 2FA...
          </div>
        ) : statusError ? (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
              {statusError}
            </div>
            <div className="text-center text-zinc-400">
              <p>Debes iniciar sesión para configurar 2FA.</p>
              <Link href="/login" className="text-red-500 hover:text-red-400 font-bold">
                Ir a iniciar sesión
              </Link>
            </div>
          </div>
        ) : status?.isTwoFactorEnabled ? (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-500 px-4 py-3 rounded mb-6 text-center">
              2FA ya está activado en tu cuenta.
            </div>
            <div className="text-center text-zinc-400">
              <p>Puedes volver al inicio o desactivar 2FA desde tu perfil cuando lo necesites.</p>
              <button
                onClick={() => router.push("/")}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded transition-colors"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded mb-6">
                {message}
              </div>
            )}

            {!qrCode ? (
              <div className="text-center">
                <p className="text-zinc-400 mb-6">
                  Asegura tu cuenta activando la Autenticación de Dos Factores (2FA) con Google Authenticator.
                </p>
                <button
                  onClick={generateSecret}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded transition-colors"
                >
                  {loading ? "Generando..." : status?.hasSecret ? "Reiniciar configuración" : "Comenzar configuración"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-zinc-400 mb-4 text-center">
                  1. Escanea este código QR con Google Authenticator.
                </p>
                <div className="bg-white p-4 rounded-xl mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
                </div>

                <p className="text-zinc-400 mb-4 text-center">
                  2. Introduce el código de 6 dígitos que aparece en la app para verificar.
                </p>
                <form onSubmit={verifyToken} className="w-full flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-4 py-2 text-white focus:outline-none focus:border-red-600 transition-colors"
                    placeholder="123456"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition-colors"
                  >
                    Verificar
                  </button>
                </form>

                {secret && (
                  <p className="text-zinc-500 mt-4 text-sm text-center">
                    Si no puedes escanear el QR, ingresa este código manualmente: <span className="text-white">{secret}</span>
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
