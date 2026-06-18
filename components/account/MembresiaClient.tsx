"use client";

import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import { membershipStatusLabel } from "@/lib/membership/entitlements";
import type { MembershipStatus } from "@prisma/client";

type DropProduct = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
};

type MemberDrop = {
  id: string;
  dropMonth: string;
  status: string;
  statusLabel: string;
  productId: string | null;
  orderId: string | null;
  product: DropProduct | null;
};

type DropsPayload = {
  currentMonth: string;
  currentDrop: {
    dropMonth: string;
    label: string | null;
    product: DropProduct;
  } | null;
  drops: MemberDrop[];
};

type Props = {
  membershipStatus: MembershipStatus;
  membershipExpiresAt: string | null;
  isVip: boolean;
  hasStripeCustomer: boolean;
  paymentsEnabled?: boolean;
};

export default function MembresiaClient({
  membershipStatus,
  membershipExpiresAt,
  isVip,
  hasStripeCustomer,
  paymentsEnabled = true,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropsData, setDropsData] = useState<DropsPayload | null>(null);
  const [dropsLoading, setDropsLoading] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const loadDrops = useCallback(async () => {
    if (!isVip) return;
    setDropsLoading(true);
    try {
      const res = await fetch("/api/membership/drops");
      if (res.ok) {
        const data = await res.json();
        setDropsData(data);
      }
    } finally {
      setDropsLoading(false);
    }
  }, [isVip]);

  useEffect(() => {
    loadDrops();
  }, [loadDrops]);

  async function retryDrop() {
    setLoading(true);
    setRetryMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/membership/drops/retry", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Error al procesar drop");
      setRetryMessage(data.message);
      await loadDrops();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function subscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/vip", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al suscribirse");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath: "/cuenta/membresia" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al abrir portal");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 border-4 border-black bg-zinc-950 p-8 shadow-[8px_8px_0px_#000000]">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-electric-yellow">Club de la Trastienda</p>
        <h2 className="mt-2 font-display text-2xl font-bold uppercase text-white">
          {isVip ? "Miembro VIP" : "Únete al club"}
        </h2>
        <p className="mt-2 text-slate-400">
          Estado: {membershipStatusLabel(membershipStatus)}
          {membershipExpiresAt ? (
            <span className="ml-2 text-slate-500">
              · hasta {new Date(membershipExpiresAt).toLocaleDateString("es-ES")}
            </span>
          ) : null}
        </p>
      </div>

      <ul className="list-inside list-disc space-y-2 font-mono text-sm text-slate-300">
        <li>Salas privadas y más capacidad en Bar Online</li>
        <li>Drop mensual de merchandising o edición limitada</li>
        <li>Fichas técnicas premium en recetario y blog</li>
      </ul>

      {error ? <p className="font-mono text-sm text-electric-red">{error}</p> : null}

      {!paymentsEnabled ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Modo demo: la suscripción VIP con pago no está activa en este entorno. Puedes ver las ventajas del club, pero no contratar online.
        </div>
      ) : null}

      {isVip ? (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-6">
          <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-electric-yellow">
            Tu drop mensual
          </h3>
          {dropsLoading ? (
            <p className="font-mono text-sm text-slate-400">Cargando drops…</p>
          ) : dropsData ? (
            <>
              {dropsData.currentDrop ? (
                <p className="text-sm text-slate-300">
                  Este mes:{" "}
                  <span className="text-white">
                    {dropsData.currentDrop.label ?? dropsData.currentDrop.product.title}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-slate-400">El drop de {dropsData.currentMonth} se anunciará pronto.</p>
              )}
              {dropsData.drops.length > 0 ? (
                <ul className="space-y-2">
                  {dropsData.drops.slice(0, 3).map((drop) => (
                    <li
                      key={drop.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm"
                    >
                      <span className="text-slate-300">
                        {drop.dropMonth}
                        {drop.product ? ` · ${drop.product.title}` : ""}
                      </span>
                      <span className="font-mono text-xs uppercase tracking-widest text-electric-yellow">
                        {drop.statusLabel}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Aún no hay registros de drop en tu cuenta.</p>
              )}
              {dropsData.drops.some((d) => d.status === "PENDING_ADDRESS") ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">
                    Necesitamos tu dirección para enviarte el drop.
                  </p>
                  <Link
                    href="/cuenta"
                    className="inline-flex font-mono text-xs font-bold uppercase tracking-widest text-electric-blue hover:text-electric-yellow"
                  >
                    Completar dirección en mi cuenta →
                  </Link>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={retryDrop}
                    className="ml-4 font-mono text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white disabled:opacity-50"
                  >
                    Reintentar envío
                  </button>
                </div>
              ) : null}
              {retryMessage ? <p className="text-sm text-emerald-400">{retryMessage}</p> : null}
            </>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {!isVip ? (
          <button
            type="button"
            disabled={loading || !paymentsEnabled}
            onClick={subscribe}
            className="border-4 border-black bg-electric-red px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest text-white shadow-[4px_4px_0px_#000000] hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Redirigiendo…" : paymentsEnabled ? "15€/mes — Unirme" : "Suscripción no disponible (demo)"}
          </button>
        ) : null}
        {hasStripeCustomer ? (
          <button
            type="button"
            disabled={loading}
            onClick={openPortal}
            className="border-4 border-black bg-black px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest text-white shadow-[4px_4px_0px_#000000] hover:bg-zinc-800 disabled:opacity-50"
          >
            Gestionar suscripción
          </button>
        ) : null}
      </div>
    </div>
  );
}
