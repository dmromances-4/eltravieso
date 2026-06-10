"use client";

import { useState } from "react";
import MediaCard from "@/components/pantalla/MediaCard";
import type { MediaKind } from "@prisma/client";

type Item = {
  slug: string;
  title: string;
  kind: MediaKind;
  coverUrl: string | null;
  summary: string | null;
  ratingAvg: number;
  cocktailSlugs: string[];
};

const TABS: { id: MediaKind | "ALL"; label: string }[] = [
  { id: "ALL", label: "Todo" },
  { id: "FILM", label: "Películas" },
  { id: "SERIES", label: "Series" },
  { id: "PODCAST_SHOW", label: "Podcasts" },
  { id: "EVENT_VIDEO", label: "Eventos" },
];

export default function PantallaHubClient({ initialItems }: { initialItems: Item[] }) {
  const [tab, setTab] = useState<MediaKind | "ALL">("ALL");
  const items = tab === "ALL" ? initialItems : initialItems.filter((i) => i.kind === tab);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-pill px-4 py-2 text-xs font-medium ${
              tab === t.id ? "bg-electric-yellow text-black" : "border border-white/10 text-slate-200 hover:border-electric-blue/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <MediaCard key={item.slug} {...item} />
        ))}
      </div>
      {items.length === 0 ? <p className="text-slate-300">No hay contenido en esta categoría.</p> : null}
    </div>
  );
}
