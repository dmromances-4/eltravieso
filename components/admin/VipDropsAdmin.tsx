"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProductOption = {
  id: string;
  title: string;
  slug: string;
  variants: { id: string; sku: string; format: string; stock: number; priceCents: number }[];
};

type DropRow = {
  id: string;
  dropMonth: string;
  label: string | null;
  productId: string;
  variantId: string | null;
  product: { id: string; title: string; slug: string };
  variant: { id: string; sku: string; format: string; stock: number } | null;
  createdAt: string;
  statusCounts: Record<string, number>;
};

type FulfillmentRow = {
  id: string;
  userEmail: string;
  userName: string | null;
  status: string;
  orderId: string | null;
};

export default function VipDropsAdmin() {
  const router = useRouter();
  const [drops, setDrops] = useState<DropRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [dropMonth, setDropMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [label, setLabel] = useState("");

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [fulfillments, setFulfillments] = useState<FulfillmentRow[]>([]);
  const [loadingFulfillments, setLoadingFulfillments] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/vip-drops");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Error al cargar");
      setDrops(data.drops ?? []);
      setProducts(data.products ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadFulfillments = async (month: string) => {
    setSelectedMonth(month);
    setLoadingFulfillments(true);
    try {
      const res = await fetch(`/api/admin/vip-drops/${month}/fulfillments`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Error");
      setFulfillments(data.fulfillments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar fulfillments");
    } finally {
      setLoadingFulfillments(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/vip-drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dropMonth,
          productId,
          variantId: variantId || null,
          label: label || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Error al guardar");
      setMessage(data.message ?? "Guardado.");
      router.refresh();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleProcess = async (month: string) => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/vip-drops/${month}/process`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Error al procesar");
      setMessage(data.message);
      await load();
      if (selectedMonth === month) await loadFulfillments(month);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkFulfilled = async (fulfillmentId: string) => {
    if (!selectedMonth) return;
    try {
      const res = await fetch(`/api/admin/vip-drops/${selectedMonth}/fulfillments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfillmentId, status: "FULFILLED" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Error");
      await loadFulfillments(selectedMonth);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleDelete = async (month: string) => {
    if (!window.confirm(`¿Eliminar configuración del drop ${month}?`)) return;
    try {
      const res = await fetch(`/api/admin/vip-drops/${month}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Error");
      setMessage(data.message);
      if (selectedMonth === month) {
        setSelectedMonth(null);
        setFulfillments([]);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  if (loading) {
    return <p className="text-slate-400">Cargando drops VIP…</p>;
  }

  return (
    <div className="space-y-10">
      <form onSubmit={handleSave} className="max-w-xl space-y-4 rounded-2xl border border-white/10 bg-[#121212] p-6">
        <h2 className="font-display text-xl font-bold text-white">Configurar drop del mes</h2>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Mes (YYYY-MM)</label>
          <input
            type="month"
            value={dropMonth}
            onChange={(e) => setDropMonth(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Producto</label>
          <select
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setVariantId("");
            }}
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
            required
          >
            <option value="">Seleccionar producto…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && selectedProduct.variants.length > 0 ? (
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
              Variante (opcional)
            </label>
            <select
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
            >
              <option value="">Auto (primera con stock)</option>
              {selectedProduct.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.sku} · {v.format} · stock {v.stock}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Etiqueta</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Botellón 3L edición junio"
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar drop"}
        </button>
      </form>

      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="text-sm text-electric-red">{error}</p> : null}

      <div className="space-y-4">
        <h2 className="font-display text-xl font-bold text-white">Drops configurados</h2>
        {drops.length === 0 ? (
          <p className="text-slate-400">No hay drops configurados.</p>
        ) : (
          <ul className="space-y-3">
            {drops.map((drop) => (
              <li
                key={drop.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#121212] px-5 py-4"
              >
                <div>
                  <p className="font-semibold text-white">
                    {drop.dropMonth}
                    {drop.label ? ` — ${drop.label}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {drop.product.title}
                    {drop.variant ? ` · ${drop.variant.sku} (stock ${drop.variant.stock})` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {Object.entries(drop.statusCounts)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ") || "Sin fulfillments"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => loadFulfillments(drop.dropMonth)}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/5"
                  >
                    Ver miembros
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProcess(drop.dropMonth)}
                    disabled={saving}
                    className="rounded-full bg-electric-blue px-4 py-2 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
                  >
                    Procesar pendientes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(drop.dropMonth)}
                    className="rounded-full border border-electric-red/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-electric-red hover:bg-electric-red/10"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedMonth ? (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-white">Fulfillments — {selectedMonth}</h2>
          {loadingFulfillments ? (
            <p className="text-slate-400">Cargando…</p>
          ) : fulfillments.length === 0 ? (
            <p className="text-slate-400">Sin registros para este mes.</p>
          ) : (
            <ul className="space-y-2">
              {fulfillments.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm"
                >
                  <div>
                    <span className="text-white">{f.userName ?? f.userEmail}</span>
                    <span className="ml-2 text-slate-500">{f.status}</span>
                    {f.orderId ? <span className="ml-2 text-xs text-slate-600">pedido {f.orderId.slice(0, 8)}…</span> : null}
                  </div>
                  {f.status === "ORDER_CREATED" ? (
                    <button
                      type="button"
                      onClick={() => handleMarkFulfilled(f.id)}
                      className="text-xs font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300"
                    >
                      Marcar enviado
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
