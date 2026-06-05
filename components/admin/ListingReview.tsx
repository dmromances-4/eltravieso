"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Listing = {
  id: string;
  title: string;
  slug: string;
  category: string;
  priceCents: number;
  status: string;
  imageUrl: string | null;
  description: string | null;
  sellerEmail: string | null;
  createdAt: string;
};

export default function ListingReview({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function review(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/marketplace/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: notes[id] || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "No se pudo completar la acción.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Error de red al revisar el artículo.");
    } finally {
      setBusyId(null);
    }
  }

  if (listings.length === 0) {
    return <p className="text-slate-400">No hay artículos pendientes de revisión.</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {listings.map((l) => (
        <div key={l.id} className="rounded-[2rem] border border-white/10 bg-[#121212] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-white">{l.title}</h3>
              <p className="text-xs text-slate-500">
                {l.category} · {(l.priceCents / 100).toFixed(2)} € · por {l.sellerEmail ?? "desconocido"}
              </p>
              {l.description && <p className="mt-2 text-sm text-slate-400">{l.description}</p>}
            </div>
            {l.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.imageUrl} alt={l.title} className="h-20 w-20 rounded-xl object-cover" />
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              className="flex-1 min-w-[200px] rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-electric-yellow/50 focus:outline-none"
              placeholder="Nota de revisión (opcional)"
              value={notes[l.id] ?? ""}
              onChange={(e) => setNotes({ ...notes, [l.id]: e.target.value })}
            />
            <button
              onClick={() => review(l.id, "approve")}
              disabled={busyId === l.id}
              className="rounded-full bg-emerald-400 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:brightness-110 disabled:opacity-50"
            >
              {busyId === l.id ? "..." : "Aprobar"}
            </button>
            <button
              onClick={() => review(l.id, "reject")}
              disabled={busyId === l.id}
              className="rounded-full border border-red-500/40 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
