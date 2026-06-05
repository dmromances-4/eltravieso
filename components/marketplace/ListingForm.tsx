"use client";

import { useEffect, useState } from "react";

type Listing = {
  id: string;
  title: string;
  slug: string;
  category: string;
  priceCents: number;
  status: string;
  imageUrl: string | null;
  reviewNotes: string | null;
  createdAt: string;
};

const CATEGORIES: { value: string; label: string }[] = [
  { value: "CRISTALERIA", label: "Cristalería" },
  { value: "MATERIAL", label: "Material de bar" },
  { value: "ROPA", label: "Ropa" },
  { value: "MERCH", label: "Merch" },
  { value: "SIROPE", label: "Siropes" },
  { value: "SODA", label: "Sodas" },
  { value: "COCTELERIA", label: "Coctelería" },
  { value: "ALCOHOL", label: "Alcoholes" },
  { value: "VERMUT", label: "Vermut" },
  { value: "CONSERVA_LATERIO", label: "Conservas" },
];

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En revisión", className: "bg-amber-400/10 text-amber-300 border-amber-400/30" },
  APPROVED: { label: "Publicado", className: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30" },
  REJECTED: { label: "Rechazado", className: "bg-red-400/10 text-red-300 border-red-400/30" },
  DRAFT: { label: "Borrador", className: "bg-white/10 text-slate-300 border-white/20" },
};

export default function ListingForm() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [form, setForm] = useState({
    title: "",
    category: "CRISTALERIA",
    priceEuros: "",
    imageUrl: "",
    description: "",
  });

  async function load() {
    try {
      const res = await fetch("/api/marketplace/listings");
      const data = await res.json();
      if (res.ok) setListings(data.listings ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          priceEuros: Number(form.priceEuros),
          imageUrl: form.imageUrl || null,
          description: form.description || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.message || "No se pudo enviar el artículo." });
      } else {
        setMessage({ type: "ok", text: data.message || "Artículo enviado a revisión." });
        setForm({ title: "", category: "CRISTALERIA", priceEuros: "", imageUrl: "", description: "" });
        load();
      }
    } catch {
      setMessage({ type: "err", text: "Error de red al enviar el artículo." });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-white placeholder:text-slate-500 focus:border-electric-yellow/50 focus:outline-none";

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-6 space-y-4">
        <h2 className="font-display text-xl font-bold text-white">Sube un artículo al marketplace</h2>
        <p className="text-sm text-slate-400">
          Tu artículo se enviará a revisión. Cuando un administrador lo apruebe, aparecerá en la tienda.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Título</span>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Coctelera Boston de acero"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Categoría</span>
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Precio (€)</span>
            <input
              className={inputClass}
              type="number"
              min="0"
              step="0.01"
              value={form.priceEuros}
              onChange={(e) => setForm({ ...form, priceEuros: e.target.value })}
              placeholder="24.90"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">URL de imagen (opcional)</span>
            <input
              className={inputClass}
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://..."
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Descripción</span>
          <textarea
            className={inputClass}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe el artículo, materiales, medidas..."
          />
        </label>

        {message && (
          <p className={`text-sm ${message.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>{message.text}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:brightness-110 disabled:opacity-50"
        >
          {submitting ? "Enviando..." : "Enviar a revisión"}
        </button>
      </form>

      <div className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-6">
        <h3 className="font-display text-lg font-bold text-white">Mis artículos</h3>
        {loading ? (
          <p className="mt-4 text-sm text-slate-400">Cargando...</p>
        ) : listings.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">Aún no has subido ningún artículo.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {listings.map((l) => {
              const status = STATUS_LABEL[l.status] ?? STATUS_LABEL.PENDING;
              return (
                <li
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0f0f0f] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{l.title}</p>
                    <p className="text-xs text-slate-500">
                      {l.category} · {(l.priceCents / 100).toFixed(2)} €
                    </p>
                    {l.reviewNotes && <p className="mt-1 text-xs text-slate-400">Nota: {l.reviewNotes}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}>
                    {status.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
