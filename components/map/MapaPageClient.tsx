"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const VenueMap = dynamic(() => import("@/components/map/VenueMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center rounded-[2rem] border border-white/10 bg-[#111] text-slate-400">
      Cargando mapa…
    </div>
  ),
});

type EditorialVenue = {
  slug: string;
  name: string;
  city: string;
  worlds50bestRank: number;
  worlds50bestCategory: string;
};

type Props = {
  editorialIndex?: EditorialVenue[];
};

export default function MapaPageClient({ editorialIndex = [] }: Props) {
  return (
    <main className="min-h-screen bg-night pb-12 pt-28 text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-6 sm:px-8">
        <section className="space-y-4">
          <span className="inline-flex rounded-full border border-electric-yellow/20 bg-electric-yellow/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-electric-yellow">
            Directorio
          </span>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Guía de locales</h1>
          <p className="max-w-2xl text-slate-400">
            Coctelerías y restaurantes de la red El Travieso, más los destacados del ranking
            World&apos;s 50 Best. Activa las capas en el mapa para explorar.
          </p>
        </section>

        <VenueMap />

        {editorialIndex.length > 0 ? (
          <section className="border-4 border-black bg-zinc-900 p-6 shadow-[6px_6px_0px_#000000]">
            <h2 className="mb-4 font-display text-2xl font-bold uppercase text-electric-yellow">
              Destacados World&apos;s 50 Best
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {editorialIndex.map((v) => (
                <li key={v.slug}>
                  <Link
                    href={`/locales/${v.slug}`}
                    className="block border-2 border-black bg-black px-4 py-3 font-mono text-sm transition hover:border-electric-yellow hover:text-electric-yellow"
                  >
                    <span className="text-electric-yellow">#{v.worlds50bestRank}</span> {v.name}
                    <span className="block text-xs text-slate-500">{v.city}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
