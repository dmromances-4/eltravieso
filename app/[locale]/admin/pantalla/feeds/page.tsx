"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

export default function AdminPodcastFeedsPage() {
  const [feeds, setFeeds] = useState<Array<{ id: string; title: string; rssUrl: string; lastSyncedAt: string | null; lastError: string | null; show: { slug: string } }>>([]);
  const [title, setTitle] = useState("");
  const [rssUrl, setRssUrl] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/podcast-feeds");
    const data = await res.json();
    setFeeds(data.feeds ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/podcast-feeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, rssUrl, publish: true }),
    });
    setTitle("");
    setRssUrl("");
    load();
  };

  const sync = async (id: string) => {
    await fetch(`/api/admin/podcast-feeds/${id}/sync`, { method: "POST" });
    load();
  };

  return (
    <div className="space-y-8">
      <Link href="/admin/pantalla" className="text-sm text-electric-yellow hover:underline">← Pantalla</Link>
      <h1 className="text-3xl font-display font-bold text-white">Feeds RSS</h1>

      <form onSubmit={create} className="max-w-xl space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nombre del podcast" required className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white" />
        <input value={rssUrl} onChange={(e) => setRssUrl(e.target.value)} placeholder="https://.../feed.xml" required className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white" />
        <button type="submit" className="rounded-full bg-electric-red px-5 py-2 text-xs font-bold uppercase text-white">Registrar feed</button>
      </form>

      <ul className="space-y-3">
        {feeds.map((f) => (
          <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#121212] p-4">
            <div>
              <p className="font-semibold text-white">{f.title}</p>
              <p className="text-xs text-slate-500">{f.rssUrl}</p>
              {f.lastError ? <p className="text-xs text-red-400">{f.lastError}</p> : null}
            </div>
            <button type="button" onClick={() => sync(f.id)} className="text-xs font-bold uppercase text-electric-yellow underline">
              Sincronizar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
