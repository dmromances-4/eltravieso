"use client";

import { useEffect, useState } from "react";

type SaleRow = {
  id: string;
  grossCents: number;
  partnerCents: number;
  platformCents: number;
  settled: boolean;
  createdAt: string;
  product: { title: string };
  order: { orderNumber: string; status: string };
};

function formatEur(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

export default function PartnerSalesPanel() {
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [totals, setTotals] = useState({ grossCents: 0, partnerCents: 0, pendingCents: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/marketplace/sales")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error cargando ventas");
        setRows(data.sales ?? []);
        setTotals(data.totals ?? { grossCents: 0, partnerCents: 0, pendingCents: 0 });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="font-mono text-sm text-slate-400">Cargando ventas…</p>;
  }

  if (error) {
    return <p className="font-mono text-sm text-electric-red">{error}</p>;
  }

  return (
    <section className="space-y-4 border-4 border-black bg-zinc-900 p-6 shadow-[6px_6px_0px_#000000]">
      <h2 className="font-display text-xl font-bold uppercase text-white">Tus ventas</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border-2 border-black bg-black p-4">
          <p className="font-mono text-xs uppercase text-slate-500">Bruto</p>
          <p className="font-display text-2xl text-electric-yellow">{formatEur(totals.grossCents)}</p>
        </div>
        <div className="border-2 border-black bg-black p-4">
          <p className="font-mono text-xs uppercase text-slate-500">Tu parte</p>
          <p className="font-display text-2xl text-white">{formatEur(totals.partnerCents)}</p>
        </div>
        <div className="border-2 border-black bg-black p-4">
          <p className="font-mono text-xs uppercase text-slate-500">Pendiente de payout</p>
          <p className="font-display text-2xl text-electric-blue">{formatEur(totals.pendingCents)}</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="font-mono text-sm text-slate-500">Aún no hay ventas de tus productos.</p>
      ) : (
        <ul className="divide-y divide-white/10 font-mono text-sm">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span className="text-slate-300">
                {row.product.title} · {row.order.orderNumber}
              </span>
              <span className="text-electric-yellow">{formatEur(row.partnerCents)}</span>
              <span className="text-xs uppercase text-slate-500">
                {row.settled ? "Liquidado" : "Pendiente"}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="font-mono text-xs text-slate-500">
        Los payouts automáticos vía Stripe Connect llegarán en una fase posterior. De momento el ledger registra tu
        parte pendiente.
      </p>
    </section>
  );
}
