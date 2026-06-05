"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketingEmailOptIn, setMarketingEmailOptIn] = useState(false);
  const [marketingSmsOptIn, setMarketingSmsOptIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError("Debes aceptar los términos y la política de privacidad.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          marketingEmailOptIn,
          marketingSmsOptIn,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error al registrarse");
        return;
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        router.push("/login?registered=true");
        return;
      }

      router.push("/cuenta");
      router.refresh();
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] flex flex-col justify-center px-6 py-12 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(255,204,0,0.1),_transparent_35%)]" />

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="group mx-auto flex w-max items-center justify-center gap-2 mb-8 text-white transition-colors hover:text-electric-yellow">
          <span className="font-display text-3xl font-bold tracking-tighter">EL TRAVIESO</span>
        </Link>
        <h2 className="text-center text-2xl font-bold tracking-tight text-white mb-2">Crea tu cuenta</h2>
        <p className="text-center text-sm text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-electric-yellow transition-colors hover:text-white">
            Inicia sesión
          </Link>
        </p>
      </div>

      <div className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-[2.5rem] border border-white/10 bg-[#121212]/90 p-8 shadow-neon backdrop-blur-xl sm:p-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
            )}

            <div>
              <label htmlFor="name" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 block w-full rounded-full border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white placeholder-slate-600 focus:border-electric-yellow focus:outline-none focus:ring-1 focus:ring-electric-yellow sm:text-sm"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 block w-full rounded-full border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white placeholder-slate-600 focus:border-electric-yellow focus:outline-none focus:ring-1 focus:ring-electric-yellow sm:text-sm"
                placeholder="tucorreo@ejemplo.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 block w-full rounded-full border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white placeholder-slate-600 focus:border-electric-yellow focus:outline-none focus:ring-1 focus:ring-electric-yellow sm:text-sm"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
                Confirmar contraseña
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 block w-full rounded-full border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white placeholder-slate-600 focus:border-electric-yellow focus:outline-none focus:ring-1 focus:ring-electric-yellow sm:text-sm"
                placeholder="Repite la contraseña"
              />
            </div>

            <label className="flex items-start gap-3 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 rounded border-white/20"
              />
              <span>
                Acepto los{" "}
                <Link href="/terminos-y-condiciones" className="text-electric-yellow hover:text-white">
                  términos
                </Link>{" "}
                y la{" "}
                <Link href="/politica-privacidad" className="text-electric-yellow hover:text-white">
                  política de privacidad
                </Link>
                .
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={marketingEmailOptIn}
                onChange={(e) => setMarketingEmailOptIn(e.target.checked)}
                className="mt-1 rounded border-white/20"
              />
              <span>Quiero recibir novedades y ofertas por email.</span>
            </label>

            <label className="flex items-start gap-3 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={marketingSmsOptIn}
                onChange={(e) => setMarketingSmsOptIn(e.target.checked)}
                className="mt-1 rounded border-white/20"
              />
              <span>Quiero recibir comunicaciones por SMS o WhatsApp (requiere teléfono en mi perfil).</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-full bg-electric-yellow px-5 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
