"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

type ProductOption = { id: string; title: string };
type BatchOption = { id: string; batchCode: string };

type TaxRegistryFormProps = {
  products: ProductOption[];
  batches: BatchOption[];
};

export default function TaxRegistryForm({ products, batches }: TaxRegistryFormProps) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [batchId, setBatchId] = useState("");
  const [caeCode, setCaeCode] = useState("");
  const [fiscalPeriod, setFiscalPeriod] = useState("");
  const [declarationDate, setDeclarationDate] = useState(new Date().toISOString().slice(0, 10));
  const [exciseTaxCents, setExciseTaxCents] = useState("");
  const [declaredLiters, setDeclaredLiters] = useState("");
  const [declaredAbv, setDeclaredAbv] = useState("");
  const [sealNumber, setSealNumber] = useState("");
  const [documentRef, setDocumentRef] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/tax-registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          batchId: batchId || null,
          caeCode,
          fiscalPeriod,
          declarationDate,
          exciseTaxCents: Math.round(parseFloat(exciseTaxCents || "0") * 100),
          declaredLiters: Math.round(parseFloat(declaredLiters || "0") * 100),
          declaredAbv: Math.round(parseFloat(declaredAbv || "0") * 100),
          sealNumber: sealNumber || null,
          documentRef: documentRef || null,
          notes: notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setMessage(json.message);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-[#121212] p-6">
      <h2 className="text-lg font-bold text-white">Nueva declaración</h2>

      {message ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Producto</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Lote (opcional)</label>
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
          >
            <option value="">— Sin lote —</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batchCode}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">CAE</label>
          <input
            value={caeCode}
            onChange={(e) => setCaeCode(e.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Periodo fiscal</label>
          <input
            value={fiscalPeriod}
            onChange={(e) => setFiscalPeriod(e.target.value)}
            placeholder="2026-Q1"
            required
            className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Fecha declaración</label>
          <input
            type="date"
            value={declarationDate}
            onChange={(e) => setDeclarationDate(e.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Impuesto (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={exciseTaxCents}
            onChange={(e) => setExciseTaxCents(e.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Litros declarados</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={declaredLiters}
            onChange={(e) => setDeclaredLiters(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">ABV (%)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={declaredAbv}
            onChange={(e) => setDeclaredAbv(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Precinta</label>
          <input
            value={sealNumber}
            onChange={(e) => setSealNumber(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Ref. AEAT</label>
          <input
            value={documentRef}
            onChange={(e) => setDocumentRef(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Notas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
        />
      </div>
      <button
        type="submit"
        disabled={saving || !productId}
        className="rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50"
      >
        {saving ? "Guardando…" : "Registrar declaración"}
      </button>
    </form>
  );
}
