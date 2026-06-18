"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

type ProductVariant = {
  id: string;
  sku: string;
  priceCents: number;
  stock: number;
};

type ProductEditFormProps = {
  product: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    isActive: boolean;
    category: string;
    source: string;
    affiliateUrl: string | null;
    affiliatePlatform: string;
    metadata: unknown;
    variants: ProductVariant[];
  };
};

const AFFILIATE_PLATFORMS = ["NONE", "AMAZON", "TEMU", "ALIEXPRESS"] as const;
const PRODUCT_SOURCES = ["PROPIO", "MARKETPLACE", "AFILIADO"] as const;

function parseMatchTerms(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "";
  const terms = (metadata as Record<string, unknown>).matchTerms;
  if (!Array.isArray(terms)) return "";
  return terms.map(String).join(", ");
}

export default function ProductEditForm({ product }: ProductEditFormProps) {
  const router = useRouter();
  const defaultVariant = product.variants[0];
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description ?? "");
  const [imageUrl, setImageUrl] = useState(product.imageUrl ?? "");
  const [isActive, setIsActive] = useState(product.isActive);
  const [source, setSource] = useState(product.source);
  const [affiliateUrl, setAffiliateUrl] = useState(product.affiliateUrl ?? "");
  const [affiliatePlatform, setAffiliatePlatform] = useState(product.affiliatePlatform);
  const [matchTerms, setMatchTerms] = useState(parseMatchTerms(product.metadata));
  const [priceCents, setPriceCents] = useState(defaultVariant?.priceCents ?? 0);
  const [stock, setStock] = useState(defaultVariant?.stock ?? 0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isAffiliate = source === "AFILIADO";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          imageUrl: imageUrl || null,
          isActive,
          source,
          affiliateUrl: isAffiliate ? affiliateUrl || null : null,
          affiliatePlatform: isAffiliate ? affiliatePlatform : "NONE",
          matchTerms: matchTerms
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          variant: defaultVariant ? { priceCents, stock: isAffiliate ? 0 : stock } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar");
      setMessage("Producto actualizado.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <label htmlFor="title" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
          Título
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Slug / Categoría</p>
        <p className="text-sm text-slate-300">
          {product.slug} · {product.category}
        </p>
      </div>

      <div>
        <label htmlFor="source" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
          Origen
        </label>
        <select
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
        >
          {PRODUCT_SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isAffiliate && (
        <>
          <div>
            <label
              htmlFor="affiliateUrl"
              className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400"
            >
              URL de afiliado
            </label>
            <input
              id="affiliateUrl"
              value={affiliateUrl}
              onChange={(e) => setAffiliateUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="affiliatePlatform"
              className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400"
            >
              Plataforma
            </label>
            <select
              id="affiliatePlatform"
              value={affiliatePlatform}
              onChange={(e) => setAffiliatePlatform(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
            >
              {AFFILIATE_PLATFORMS.filter((p) => p !== "NONE").map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div>
        <label htmlFor="matchTerms" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
          Términos de matching (CSV)
        </label>
        <input
          id="matchTerms"
          value={matchTerms}
          onChange={(e) => setMatchTerms(e.target.value)}
          placeholder="gin, shaker, jigger"
          className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-500">
          Usado para vincular este producto con ingredientes o técnicas en recetas automáticamente.
        </p>
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
          Descripción
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="imageUrl" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
          URL de imagen
        </label>
        <input
          id="imageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
        />
      </div>

      {defaultVariant ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
              {isAffiliate ? "Precio referencia (céntimos)" : "Precio (céntimos)"}
            </label>
            <input
              id="price"
              type="number"
              value={priceCents}
              onChange={(e) => setPriceCents(Number(e.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">SKU: {defaultVariant.sku}</p>
          </div>
          {!isAffiliate && (
            <div>
              <label htmlFor="stock" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
                Stock
              </label>
              <input
                id="stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
              />
            </div>
          )}
        </div>
      ) : null}

      <label className="flex items-center gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-white/20"
        />
        Producto activo en tienda
      </label>

      {message ? <p className="text-sm text-electric-yellow">{message}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-electric-yellow px-8 py-3 text-xs font-bold uppercase tracking-widest text-black hover:brightness-110 disabled:opacity-50"
      >
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
