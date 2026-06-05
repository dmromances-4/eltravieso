"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AuditListItem = {
  id: string;
  title: string;
  slug: string;
  reviewStatus: string;
  sourceUrl?: string;
  diffordsId?: number;
  reviewedAt?: string;
};

type AuditStats = {
  total: number;
  pending: number;
  ok: number;
  fixed: number;
  manual: number;
};

export default function RecipeAuditList() {
  const [recipes, setRecipes] = useState<AuditListItem[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [status, setStatus] = useState("pending");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());

    fetch(`/api/admin/recipes-audit?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).message ?? "Error al cargar");
        return res.json();
      })
      .then((data) => {
        setRecipes(data.recipes ?? []);
        setStats(data.stats ?? null);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [status, q]);

  const progress = useMemo(() => {
    if (!stats?.total) return 0;
    const done = stats.ok + stats.fixed + stats.manual;
    return Math.round((done / stats.total) * 100);
  }, [stats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Auditoría Difford&apos;s</h1>
        <p className="text-slate-400 mt-2">
          Revisa receta por receta comparando con la fuente Difford&apos;s Guide.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            ["Total", stats.total],
            ["Pendientes", stats.pending],
            ["OK", stats.ok],
            ["Corregidas", stats.fixed],
            ["Manual", stats.manual],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="h-2 flex-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-electric-yellow" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-sm text-slate-400">{progress}% revisado</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
        >
          <option value="all">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="ok">OK</option>
          <option value="fixed">Corregidas</option>
          <option value="manual">Manual</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por título, slug o id"
          className="flex-1 rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
        />
      </div>

      {loading && <p className="text-slate-400">Cargando...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-left text-slate-400 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Difford&apos;s</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => (
                <tr key={recipe.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3 font-mono text-xs">{recipe.id}</td>
                  <td className="px-4 py-3">{recipe.title}</td>
                  <td className="px-4 py-3">{recipe.reviewStatus}</td>
                  <td className="px-4 py-3">
                    {recipe.sourceUrl ? (
                      <a
                        href={recipe.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-electric-yellow hover:underline"
                      >
                        Ver
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/recetas-auditoria/${encodeURIComponent(recipe.id)}`}
                      className="text-electric-yellow hover:underline"
                    >
                      Revisar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
