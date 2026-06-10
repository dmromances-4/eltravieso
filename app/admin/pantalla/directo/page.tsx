"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LIVE_CATEGORY_LABELS } from "@/lib/media/types";

export default function AdminDirectoPage() {
  const [streams, setStreams] = useState<Array<{ id: string; title: string; slug: string; category: string; status: string; lastCheckOk: boolean | null }>>([]);
  const [title, setTitle] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [category, setCategory] = useState("GOLF");

  const load = async () => {
    const res = await fetch("/api/admin/live");
    const data = await res.json();
    setStreams(data.streams ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, embedUrl, category, status: "PUBLISHED", isLive: true }),
    });
    setTitle("");
    setEmbedUrl("");
    load();
  };

  const health = async (id: string) => {
    await fetch(`/api/admin/live/${id}`, { method: "POST" });
    load();
  };

  return (
    <div className="space-y-8">
      <Link href="/admin/pantalla" className="text-sm text-electric-yellow hover:underline">← Pantalla</Link>
      <h1 className="text-3xl font-display font-bold text-white">Directo</h1>

      <form onSubmit={create} className="max-w-xl space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" required className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white" />
        <input value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder="URL embed" required className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white">
          {Object.entries(LIVE_CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button type="submit" className="rounded-full bg-electric-red px-5 py-2 text-xs font-bold uppercase text-white">Añadir directo</button>
      </form>

      <ul className="space-y-3">
        {streams.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#121212] p-4">
            <div>
              <p className="font-semibold text-white">{s.title}</p>
              <p className="text-xs text-slate-500">{s.category} · {s.status} · check: {String(s.lastCheckOk)}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => health(s.id)} className="text-xs text-electric-yellow underline">Health</button>
              <Link href={`/pantalla/directo#${s.slug}`} className="text-xs text-slate-400 underline">Ver</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
