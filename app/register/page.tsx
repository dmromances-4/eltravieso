"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandButton } from "@/components/ui/BrandButton";
import { PageHero } from "@/components/ui/PageHero";

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

  const inputClass =
    "mt-2 block w-full rounded-pill border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white placeholder-slate-600 focus:border-electric-blue focus:outline-none focus:ring-1 focus:ring-electric-blue sm:text-sm";

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-[#0A0A0A] px-6 py-12 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(249,209,66,0.08),transparent_45%)]" />

      <div className="relative mx-auto w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="font-display text-2xl font-semibold text-white transition-colors hover:text-electric-yellow">
            El Travieso
          </Link>
          <div className="mt-8 space-y-3">
            <PageHero compact eyebrow="Comunidad" title="Crea tu cuenta" />
            <p className="text-sm text-slate-400">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="font-medium text-electric-blue hover:text-white">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>

        <div className="rounded-card border border-white/10 bg-[var(--surface-panel)] p-8 sm:p-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error ? (
              <div className="rounded-card border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
            ) : null}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                Nombre
              </label>
              <input id="name" type="text" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Tu nombre" />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email
              </label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="tucorreo@ejemplo.com" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Contraseña
              </label>
              <input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Mínimo 8 caracteres" />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-slate-300">
                Confirmar contraseña
              </label>
              <input id="confirm" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Repite la contraseña" />
            </div>

            <label className="flex items-start gap-3 text-sm text-slate-400">
              <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1 rounded border-white/20" />
              <span>
                Acepto los{" "}
                <Link href="/terminos-y-condiciones" className="text-electric-blue hover:text-white">
                  términos
                </Link>{" "}
                y la{" "}
                <Link href="/politica-privacidad" className="text-electric-blue hover:text-white">
                  política de privacidad
                </Link>
                .
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm text-slate-400">
              <input type="checkbox" checked={marketingEmailOptIn} onChange={(e) => setMarketingEmailOptIn(e.target.checked)} className="mt-1 rounded border-white/20" />
              <span>Quiero recibir novedades y ofertas por email.</span>
            </label>

            <label className="flex items-start gap-3 text-sm text-slate-400">
              <input type="checkbox" checked={marketingSmsOptIn} onChange={(e) => setMarketingSmsOptIn(e.target.checked)} className="mt-1 rounded border-white/20" />
              <span>Quiero recibir comunicaciones por SMS o WhatsApp (requiere teléfono en mi perfil).</span>
            </label>

            <BrandButton type="submit" disabled={loading} className="w-full">
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </BrandButton>
          </form>
        </div>
      </div>
    </div>
  );
}
