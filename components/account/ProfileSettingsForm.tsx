"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, type FormEvent } from "react";
import AvatarUpload from "@/components/account/AvatarUpload";
import type { UserProfilePayload } from "@/lib/user/profile";

const emptyProfile: UserProfilePayload = {
  id: "",
  name: "",
  email: "",
  imageUrl: null,
  birthDate: null,
  address: null,
  city: null,
  postalCode: null,
  country: "España",
  role: "USER",
  isTwoFactorEnabled: false,
  hasTwoFactorSecret: false,
  createdAt: "",
  updatedAt: "",
};

export default function ProfileSettingsForm() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfilePayload>(emptyProfile);
  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      setLoadingProfile(true);
      try {
        const res = await fetch("/api/user/me");
        const data = await res.json();
        if (res.ok) {
          setProfile(data);
        }
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, []);

  const emailChanged = profile.email !== session?.user?.email;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          birthDate: profile.birthDate,
          address: profile.address ?? "",
          city: profile.city ?? "",
          postalCode: profile.postalCode ?? "",
          country: profile.country ?? "España",
          currentPassword: emailChanged ? currentPassword : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "No se pudo actualizar el perfil");
      }

      setProfile(data.user);
      setCurrentPassword("");
      await update({
        name: data.user.name,
        email: data.user.email,
        image: data.user.imageUrl,
      });
      setMessage(data.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const setField = <K extends keyof UserProfilePayload>(key: K, value: UserProfilePayload[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  if (loadingProfile) {
    return <p className="text-sm text-slate-400">Cargando perfil…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {message ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-[#0f0f0f]/80 p-6">
        <AvatarUpload
          imageUrl={profile.imageUrl}
          name={profile.name ?? "Usuario"}
          onUpdated={(url) => setField("imageUrl", url)}
        />
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-electric-yellow">Datos personales</h2>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              required
              value={profile.name ?? ""}
              onChange={(e) => setField("name", e.target.value)}
              className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white focus:border-electric-yellow focus:outline-none focus:ring-1 focus:ring-electric-yellow sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={profile.email}
              onChange={(e) => setField("email", e.target.value)}
              className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white focus:border-electric-yellow focus:outline-none focus:ring-1 focus:ring-electric-yellow sm:text-sm"
            />
            <p className="mt-2 text-xs text-slate-500">Si cambias el email, confirma con tu contraseña actual.</p>
          </div>

          {emailChanged ? (
            <div className="sm:col-span-2">
              <label htmlFor="currentPassword" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
                Contraseña actual (para confirmar email)
              </label>
              <input
                id="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white focus:border-electric-yellow focus:outline-none sm:text-sm"
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="birthDate" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
              Fecha de cumpleaños
            </label>
            <input
              id="birthDate"
              type="date"
              value={profile.birthDate ?? ""}
              onChange={(e) => setField("birthDate", e.target.value || null)}
              max={new Date().toISOString().slice(0, 10)}
              className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white focus:border-electric-yellow focus:outline-none sm:text-sm [color-scheme:dark]"
            />
            <p className="mt-2 text-xs text-slate-500">Mayor de 18 años. Para ofertas y experiencias personalizadas.</p>
          </div>

          <div>
            <label htmlFor="country" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
              País
            </label>
            <input
              id="country"
              type="text"
              value={profile.country ?? "España"}
              onChange={(e) => setField("country", e.target.value)}
              className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white focus:border-electric-yellow focus:outline-none sm:text-sm"
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-electric-yellow">Dirección de envío</h2>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
              Dirección
            </label>
            <input
              id="address"
              type="text"
              placeholder="Calle, número, piso…"
              value={profile.address ?? ""}
              onChange={(e) => setField("address", e.target.value || null)}
              className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white placeholder-slate-600 focus:border-electric-yellow focus:outline-none sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
              Ciudad
            </label>
            <input
              id="city"
              type="text"
              value={profile.city ?? ""}
              onChange={(e) => setField("city", e.target.value || null)}
              className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white focus:border-electric-yellow focus:outline-none sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="postalCode" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
              Código postal
            </label>
            <input
              id="postalCode"
              type="text"
              value={profile.postalCode ?? ""}
              onChange={(e) => setField("postalCode", e.target.value || null)}
              className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white focus:border-electric-yellow focus:outline-none sm:text-sm"
            />
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-electric-yellow px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? "Guardando…" : "Guardar perfil completo"}
      </button>
    </form>
  );
}
