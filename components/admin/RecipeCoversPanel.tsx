"use client";

import { useState } from "react";

type CandidatePreview = {
  source: string;
  score: number;
  url: string;
  attribution?: string;
};

type RecipeCoverRow = {
  slug: string;
  title: string;
  cover: string;
  candidates: CandidatePreview[];
};

export default function RecipeCoversPanel({ rows }: { rows: RecipeCoverRow[] }) {
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function applyCandidate(slug: string, url: string, attribution?: string) {
    setBusySlug(slug);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/recipe-covers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, url, attribution }),
      });
      const data = (await res.json()) as { message?: string; imageUrl?: string };
      if (!res.ok) throw new Error(data.message ?? "Error al aplicar portada");
      setMessage(`Portada aplicada para ${slug}: ${data.imageUrl}`);
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setBusySlug(null);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-card border border-white/10 bg-[var(--surface-panel)] p-6 text-slate-400">
        No hay recetas pendientes de portada foto. Ejecuta{" "}
        <code className="text-electric-blue">npm run generate:recipe-images -- --discover-only --limit 20</code>{" "}
        para generar manifests.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {message ? (
        <p className="rounded-card border border-electric-blue/30 bg-electric-blue/10 px-4 py-3 text-sm text-slate-200">
          {message}
        </p>
      ) : null}
      {rows.map((row) => (
        <article
          key={row.slug}
          className="rounded-card border border-white/10 bg-[var(--surface-panel)] p-6 space-y-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">{row.title}</h2>
              <p className="text-sm text-slate-500">{row.slug}</p>
              <p className="mt-1 text-xs text-slate-600">Cover actual: {row.cover}</p>
            </div>
            <a
              href={`/recetas/${row.slug}`}
              className="text-sm text-electric-blue hover:text-white"
              target="_blank"
              rel="noreferrer"
            >
              Ver ficha
            </a>
          </div>
          {row.candidates.length === 0 ? (
            <p className="text-sm text-slate-500">Sin manifest. Ejecuta discover-only para este slug.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-3">
              {row.candidates.map((candidate, idx) => (
                <li key={candidate.url} className="space-y-2 rounded-xl border border-white/10 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={candidate.url}
                    alt=""
                    className="aspect-[4/5] w-full rounded-lg object-cover bg-black"
                  />
                  <p className="text-xs text-slate-400">
                    #{idx + 1} · {candidate.source} · score {candidate.score.toFixed(2)}
                  </p>
                  {candidate.attribution ? (
                    <p className="text-[10px] text-slate-500">{candidate.attribution}</p>
                  ) : null}
                  <button
                    type="button"
                    disabled={busySlug === row.slug}
                    onClick={() => applyCandidate(row.slug, candidate.url, candidate.attribution)}
                    className="w-full rounded-full bg-electric-yellow px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
                  >
                    {busySlug === row.slug ? "Aplicando…" : "Usar esta foto"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}
