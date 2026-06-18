"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

type DeliveryRouteItem = {
  id: string;
  routeCode: string;
  status: string;
  plannedDate: string;
  vehiclePlate: string | null;
  stops: Array<{ id: string; stopOrder: number; barProfile: { businessName: string; city: string } }>;
  orders: Array<{ orderNumber: string; status: string }>;
};

const STATUS_OPTIONS = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function DeliveryRoutesList({ routes }: { routes: DeliveryRouteItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/delivery-routes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al actualizar");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setBusyId(null);
    }
  };

  const deleteRoute = async (id: string, code: string) => {
    if (!window.confirm(`¿Eliminar la ruta ${code}?`)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/delivery-routes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al eliminar");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setBusyId(null);
    }
  };

  if (routes.length === 0) {
    return <p className="text-slate-400">No hay rutas planificadas todavía.</p>;
  }

  return (
    <ul className="space-y-4">
      {routes.map((route) => (
        <li key={route.id} className="rounded-2xl border border-white/10 bg-[#121212] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-white">{route.routeCode}</p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(route.plannedDate).toLocaleDateString("es-ES")}
                {route.vehiclePlate ? ` · ${route.vehiclePlate}` : ""} · {route.orders.length} pedidos
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={route.status}
                disabled={busyId === route.id}
                onChange={(e) => updateStatus(route.id, e.target.value)}
                className="rounded-full border border-white/20 bg-[#0a0a0a] px-3 py-2 text-xs font-bold uppercase tracking-widest text-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busyId === route.id || route.status === "IN_PROGRESS"}
                onClick={() => deleteRoute(route.id, route.routeCode)}
                className="rounded-full border border-red-500/40 px-3 py-2 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          </div>
          {route.stops.length > 0 ? (
            <ol className="mt-4 space-y-2 border-t border-white/10 pt-4">
              {route.stops.map((stop) => (
                <li key={stop.id} className="text-sm text-slate-300">
                  {stop.stopOrder}. {stop.barProfile.businessName} — {stop.barProfile.city}
                </li>
              ))}
            </ol>
          ) : null}
          {route.orders.length > 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              Pedidos: {route.orders.map((o) => o.orderNumber).join(", ")}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
