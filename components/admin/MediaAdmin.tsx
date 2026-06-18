"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { MEDIA_KIND_LABELS } from "@/lib/media/types";

export type AdminMediaRow = {
  id: string;
  title: string;
  slug: string;
  kind: keyof typeof MEDIA_KIND_LABELS;
  status: string;
  updatedAt: string;
  barProfile?: { businessName: string } | null;
};

export function MediaAdminList({
  items,
  pendingOnly = false,
}: {
  items: AdminMediaRow[];
  pendingOnly?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const approve = async (id: string) => {
    setBusy(id);
    await fetch(`/api/admin/media/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    setBusy(null);
    router.refresh();
  };

  const filtered = pendingOnly ? items.filter((i) => i.status === "PENDING") : items;

  if (filtered.length === 0) {
    return <p className="text-slate-400">{pendingOnly ? "No hay eventos pendientes." : "Sin contenido."}</p>;
  }

  return (
    <ul className="space-y-3">
      {filtered.map((item) => (
        <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#121212] px-5 py-4">
          <div>
            <p className="font-semibold text-white">{item.title}</p>
            <p className="mt-1 text-xs text-slate-500">
              {MEDIA_KIND_LABELS[item.kind]} · {item.status}
              {item.barProfile ? ` · ${item.barProfile.businessName}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            {item.status === "PENDING" ? (
              <button
                type="button"
                disabled={busy === item.id}
                onClick={() => approve(item.id)}
                className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
              >
                Aprobar
              </button>
            ) : null}
            <Link
              href={`/admin/pantalla/${item.id}/edit`}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
            >
              Editar
            </Link>
            <Link href={`/pantalla/${item.slug}`} className="text-xs text-electric-yellow underline">
              Ver
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MediaAdminForm({ itemId }: { itemId?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("FILM");
  const [summary, setSummary] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [cocktailSlugs, setCocktailSlugs] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<{ id: number; title?: string; name?: string; media_type?: string }[]>([]);
  const [initialLoading, setInitialLoading] = useState(Boolean(itemId));

  useEffect(() => {
    if (!itemId) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/admin/media/${itemId}`);
      if (!res.ok) {
        if (!cancelled) {
          setError("No se pudo cargar el contenido.");
          setInitialLoading(false);
        }
        return;
      }
      const data = await res.json();
      const item = data.item;
      if (cancelled || !item) return;
      setTitle(item.title ?? "");
      setKind(item.kind ?? "FILM");
      setSummary(item.summary ?? "");
      setMediaUrl(item.mediaUrl ?? "");
      setPlaybackUrl(item.playbackUrl ?? "");
      setCocktailSlugs((item.cocktailSlugs ?? []).join(", "));
      setStatus(item.status ?? "DRAFT");
      setInitialLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const searchTmdb = async () => {
    const res = await fetch(`/api/admin/media/tmdb/search?q=${encodeURIComponent(tmdbQuery)}`);
    const data = await res.json();
    setTmdbResults(data.results ?? []);
  };

  const importTmdb = async (id: number, type: string) => {
    setLoading(true);
    const res = await fetch("/api/admin/media/import/tmdb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdbId: id, type, publish: false }),
    });
    setLoading(false);
    if (res.ok) router.push("/admin/pantalla");
    else setError((await res.json()).message ?? "Error import");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const payload = {
      title,
      kind,
      summary,
      mediaUrl,
      playbackUrl,
      cocktailSlugs: cocktailSlugs.split(",").map((s) => s.trim()).filter(Boolean),
      status,
    };
    const url = itemId ? `/api/admin/media/${itemId}` : "/api/admin/media";
    const method = itemId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (res.ok) router.push("/admin/pantalla");
    else setError((await res.json()).message ?? "Error");
  };

  return (
    <div className="space-y-10">
      {initialLoading ? <p className="text-slate-400">Cargando…</p> : null}
      <form onSubmit={submit} className="space-y-4 max-w-2xl">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" required className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white" />
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white">
          {Object.entries(MEDIA_KIND_LABELS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Resumen" rows={4} className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white" />
        <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="URL embed (YouTube, Spotify...)" className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white" />
        <input value={playbackUrl} onChange={(e) => setPlaybackUrl(e.target.value)} placeholder="URL reproducción privada (HLS/MP4/iframe)" className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white" />
        <input value={cocktailSlugs} onChange={(e) => setCocktailSlugs(e.target.value)} placeholder="Slugs cócteles (coma)" className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white">
          <option value="DRAFT">Borrador</option>
          <option value="PUBLISHED">Publicado</option>
          <option value="ARCHIVED">Archivado</option>
        </select>
        {error ? <p className="text-red-400">{error}</p> : null}
        <button type="submit" disabled={loading} className="rounded-full bg-electric-red px-6 py-3 text-xs font-bold uppercase tracking-widest text-white">
          Guardar
        </button>
      </form>

      {!itemId ? (
        <div className="max-w-2xl space-y-3 rounded-2xl border border-white/10 p-5">
          <h3 className="font-bold text-white">Importar desde TMDB</h3>
          <div className="flex gap-2">
            <input value={tmdbQuery} onChange={(e) => setTmdbQuery(e.target.value)} placeholder="Buscar película o serie" className="flex-1 rounded-xl border border-white/10 bg-black/40 p-3 text-white" />
            <button type="button" onClick={searchTmdb} className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase text-white">Buscar</button>
          </div>
          <ul className="space-y-2">
            {tmdbResults.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 text-sm text-slate-300">
                <span>{r.title ?? r.name} ({r.media_type})</span>
                <button type="button" onClick={() => importTmdb(r.id, r.media_type === "tv" ? "tv" : "movie")} className="text-electric-yellow underline">
                  Importar
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
