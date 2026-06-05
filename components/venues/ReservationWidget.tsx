"use client";

import type { ReservationConfig } from "@/lib/venues/reservation";

type Props = {
  config: ReservationConfig;
  externalWebsite?: string | null;
  isEditorial?: boolean;
};

export default function ReservationWidget({ config, externalWebsite, isEditorial }: Props) {
  if (isEditorial && externalWebsite) {
    return (
      <div className="border-4 border-black bg-electric-yellow p-6 shadow-[8px_8px_0px_#000000]">
        <h3 className="mb-4 font-display text-2xl font-bold uppercase text-black">Reservas</h3>
        <a
          href={externalWebsite}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block border-4 border-black bg-black px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest text-white shadow-[4px_4px_0px_#000000] transition hover:bg-electric-red"
        >
          Visitar web oficial
        </a>
      </div>
    );
  }

  if (!config.url) {
    return (
      <div className="border-4 border-black bg-zinc-900 p-6 text-slate-400 shadow-[6px_6px_0px_#000000]">
        <p className="font-mono text-sm uppercase tracking-widest">Reservas no configuradas aún.</p>
      </div>
    );
  }

  if (config.mode === "iframe" && config.embedUrl) {
    return (
      <div className="border-4 border-black bg-zinc-900 p-4 shadow-[8px_8px_0px_#000000]">
        <h3 className="mb-4 font-display text-2xl font-bold uppercase text-electric-yellow">Reservar mesa</h3>
        <iframe
          src={config.embedUrl}
          title="Widget de reservas"
          className="h-[480px] w-full border-4 border-black bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    );
  }

  return (
    <div className="border-4 border-black bg-electric-yellow p-6 shadow-[8px_8px_0px_#000000]">
      <h3 className="mb-4 font-display text-2xl font-bold uppercase text-black">Reservar mesa</h3>
      <a
        href={config.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block border-4 border-black bg-black px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest text-white shadow-[4px_4px_0px_#000000] transition hover:bg-electric-red"
      >
        Reservar mesa
      </a>
    </div>
  );
}
