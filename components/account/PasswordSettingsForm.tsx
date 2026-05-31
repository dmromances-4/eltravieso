"use client";

import { useState, type FormEvent } from "react";

export default function PasswordSettingsForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "No se pudo cambiar la contraseña");
      }

      setMessage(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      ) : null}

      <div>
        <label htmlFor="current" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
          Contraseña actual
        </label>
        <input
          id="current"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="mt-2 block w-full rounded-full border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white focus:border-electric-yellow focus:outline-none sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="new" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
          Nueva contraseña
        </label>
        <input
          id="new"
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-2 block w-full rounded-full border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white focus:border-electric-yellow focus:outline-none sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="confirm" className="block text-xs font-bold uppercase tracking-widest text-slate-300">
          Repetir nueva contraseña
        </label>
        <input
          id="confirm"
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-2 block w-full rounded-full border border-white/10 bg-[#0f0f0f] px-5 py-3 text-white focus:border-electric-yellow focus:outline-none sm:text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? "Actualizando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
