"use client";

import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";

type RecipePayload = {
  id: string;
  title: string;
  slug: string;
  glass: string;
  ingredients: string[];
  method: string;
  kcal: number;
  rating: number;
  reviewStatus?: string;
  sourceUrl?: string;
};

type Comparison = {
  score: number;
  issues: string[];
  details: string[];
  expected: Pick<RecipePayload, "title" | "glass" | "ingredients" | "method" | "kcal" | "rating">;
};

export default function RecipeAuditDetail({ recipeId }: { recipeId: string }) {
  const [recipe, setRecipe] = useState<RecipePayload | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [expected, setExpected] = useState<Comparison["expected"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/recipes-audit/${encodeURIComponent(recipeId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Error al cargar");
      setRecipe(data.recipe);
      setComparison(data.comparison);
      setExpected(data.comparison?.expected ?? null);
      if (data.error) setError(data.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function apply(source: "local" | "diffords" | "manual" | "ok") {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/recipes-audit/${encodeURIComponent(recipeId)}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Error al guardar");
      setRecipe(data.recipe);
      setMessage(data.message ?? "Guardado");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function refreshDiffords() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/recipes-audit/${encodeURIComponent(recipeId)}/fetch`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Error al refrescar");
      setComparison(data.comparison);
      setExpected(data.comparison?.expected ?? null);
      setMessage("Difford's refrescado");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-slate-400">Cargando auditoría...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/admin/recetas-auditoria" className="text-sm text-slate-400 hover:text-white">
            ← Volver al listado
          </Link>
          <h1 className="text-3xl font-display font-bold mt-2">{recipe?.title ?? recipeId}</h1>
          <p className="text-slate-400 font-mono text-sm">{recipe?.id}</p>
        </div>
        {comparison && (
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-slate-500">Score</p>
            <p className="text-4xl font-bold text-electric-yellow">{comparison.score}</p>
          </div>
        )}
      </div>

      {recipe?.sourceUrl && (
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-electric-yellow hover:underline text-sm"
        >
          Abrir en Difford&apos;s Guide
        </a>
      )}

      {comparison && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
          <p className="font-bold mb-2">Issues</p>
          {comparison.issues.length ? (
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              {comparison.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : (
            <p className="text-emerald-400">Sin discrepancias relevantes.</p>
          )}
        </div>
      )}

      {error && <p className="text-amber-400">{error}</p>}
      {message && <p className="text-slate-300">{message}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        <RecipePanel title="Local (cocktails.json)" recipe={recipe} />
        <RecipePanel title="Esperado (Difford's → El Travieso)" recipe={expected} />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => apply("diffords")}
          className="px-4 py-2 rounded-lg bg-electric-yellow text-black font-bold text-sm disabled:opacity-50"
        >
          Usar Difford&apos;s
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => apply("local")}
          className="px-4 py-2 rounded-lg border border-white/20 text-sm disabled:opacity-50"
        >
          Mantener local
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => apply("ok")}
          className="px-4 py-2 rounded-lg border border-emerald-500/40 text-emerald-300 text-sm disabled:opacity-50"
        >
          Marcar revisada (OK)
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => apply("manual")}
          className="px-4 py-2 rounded-lg border border-amber-500/40 text-amber-300 text-sm disabled:opacity-50"
        >
          Requiere manual
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={refreshDiffords}
          className="px-4 py-2 rounded-lg border border-white/20 text-sm disabled:opacity-50"
        >
          Refrescar Difford&apos;s
        </button>
      </div>
    </div>
  );
}

function RecipePanel({
  title,
  recipe,
}: {
  title: string;
  recipe: Partial<RecipePayload> | null | undefined;
}) {
  if (!recipe) {
    return (
      <div className="rounded-xl border border-white/10 p-4">
        <h2 className="font-bold mb-2">{title}</h2>
        <p className="text-slate-500 text-sm">Sin datos</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 p-4 space-y-3">
      <h2 className="font-bold">{title}</h2>
      <p>
        <span className="text-slate-500">Vaso:</span> {recipe.glass}
      </p>
      <div>
        <p className="text-slate-500 mb-1">Ingredientes</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {(recipe.ingredients ?? []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-slate-500 mb-1">Método</p>
        <pre className="whitespace-pre-wrap text-sm text-slate-200">{recipe.method}</pre>
      </div>
    </div>
  );
}
