"use client";

import { useState } from "react";
import { mapPlanLabel } from "@/lib/billing/map-plan";

type MapPlan = "FREE" | "FEATURED" | "BOOKING_PLUS";

type Props = {
  mapPlan: MapPlan;
  mapPlanExpiresAt: string | null;
  isPremium: boolean;
  stripeSubscriptionId: string | null;
};

export default function MapPlanPanel({
  mapPlan,
  mapPlanExpiresAt,
  isPremium,
  stripeSubscriptionId,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(plan: "FEATURED" | "BOOKING_PLUS") {
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/billing/map-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al contratar plan");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath: "/cuenta/bar" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al abrir portal");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="mb-8 space-y-4 border-4 border-electric-yellow bg-zinc-900 p-6 shadow-[6px_6px_0px_#000000]">
      <h2 className="font-display text-xl font-bold uppercase text-electric-yellow">Plan en el mapa</h2>
      <p className="font-mono text-sm text-slate-400">
        Plan actual: <strong className="text-white">{mapPlanLabel(mapPlan)}</strong>
        {isPremium && mapPlanExpiresAt ? (
          <span className="ml-2 text-slate-500">
            (renueva {new Date(mapPlanExpiresAt).toLocaleDateString("es-ES")})
          </span>
        ) : null}
      </p>

      {error ? <p className="font-mono text-sm text-electric-red">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => subscribe("FEATURED")}
          className="border-4 border-black bg-electric-yellow px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-black shadow-[4px_4px_0px_#000000] hover:bg-white disabled:opacity-50"
        >
          {loading === "FEATURED" ? "Redirigiendo…" : "Top del Barrio"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => subscribe("BOOKING_PLUS")}
          className="border-4 border-black bg-electric-blue px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-black shadow-[4px_4px_0px_#000000] hover:bg-white disabled:opacity-50"
        >
          {loading === "BOOKING_PLUS" ? "Redirigiendo…" : "Booking Plus"}
        </button>
        {stripeSubscriptionId ? (
          <button
            type="button"
            disabled={loading !== null}
            onClick={openPortal}
            className="border-4 border-black bg-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-white shadow-[4px_4px_0px_#000000] hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading === "portal" ? "Abriendo…" : "Gestionar suscripción"}
          </button>
        ) : null}
      </div>
      <p className="font-mono text-xs text-slate-500">
        Featured: pin destacado y badge en la ficha. Booking Plus: widget de reservas embebido en tu ficha pública.
      </p>
    </section>
  );
}
