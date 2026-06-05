"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type BarOption = { id: string; businessName: string; city: string };
type OrderOption = { id: string; orderNumber: string; barName: string };

type DeliveryRouteFormProps = {
  bars: BarOption[];
  unassignedOrders: OrderOption[];
};

export default function DeliveryRouteForm({ bars, unassignedOrders }: DeliveryRouteFormProps) {
  const router = useRouter();
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().slice(0, 10));
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedBars, setSelectedBars] = useState<string[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const toggleBar = (id: string) => {
    setSelectedBars((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleOrder = (id: string) => {
    setSelectedOrders((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const stops = selectedBars.map((barProfileId, index) => ({
        barProfileId,
        stopOrder: index + 1,
      }));

      const res = await fetch("/api/admin/delivery-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plannedDate,
          vehiclePlate: vehiclePlate || null,
          notes: notes || null,
          stops,
          orderIds: selectedOrders,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear la ruta");

      setMessage(data.message ?? "Ruta creada.");
      setSelectedBars([]);
      setSelectedOrders([]);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al crear la ruta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-[#121212] p-6 space-y-6">
      <h2 className="text-lg font-bold text-white">Nueva ruta de reparto</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="planned-date" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
            Fecha planificada
          </label>
          <input
            id="planned-date"
            type="date"
            value={plannedDate}
            onChange={(e) => setPlannedDate(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="vehicle-plate" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
            Matrícula
          </label>
          <input
            id="vehicle-plate"
            value={vehiclePlate}
            onChange={(e) => setVehiclePlate(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
            placeholder="1234 ABC"
          />
        </div>
      </div>

      <div>
        <label htmlFor="route-notes" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
          Notas
        </label>
        <textarea
          id="route-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
        />
      </div>

      {unassignedOrders.length > 0 ? (
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            Pedidos sin ruta ({unassignedOrders.length})
          </p>
          <ul className="max-h-40 space-y-2 overflow-y-auto">
            {unassignedOrders.map((order) => (
              <li key={order.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-electric-yellow/30">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => toggleOrder(order.id)}
                  />
                  <span>
                    {order.orderNumber} · {order.barName}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {bars.length > 0 ? (
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            Paradas adicionales (bares)
          </p>
          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {bars.map((bar) => (
              <li key={bar.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-electric-yellow/30">
                  <input
                    type="checkbox"
                    checked={selectedBars.includes(bar.id)}
                    onChange={() => toggleBar(bar.id)}
                  />
                  <span>
                    {bar.businessName} — {bar.city}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {message ? <p className="text-sm text-electric-yellow">{message}</p> : null}

      <button
        type="submit"
        disabled={saving || (selectedBars.length === 0 && selectedOrders.length === 0)}
        className="rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-widest text-black hover:brightness-110 disabled:opacity-50"
      >
        {saving ? "Creando…" : "Crear ruta"}
      </button>
    </form>
  );
}
