"use client";

import { Link } from "@/i18n/navigation";
import type { MapVenueDTO } from "@/lib/venues/types";

type Props = {
  venue: MapVenueDTO;
  onClose: () => void;
};

export default function VenueMapPanel({ venue, onClose }: Props) {
  return (
    <aside className="w-full border-t-4 border-black bg-zinc-900 shadow-[6px_6px_0px_#000000] md:absolute md:right-4 md:top-4 md:z-10 md:max-w-sm md:border-4 md:border-black lg:max-w-md">
      <div className="flex items-start justify-between gap-3 border-b-4 border-black p-4">
        <div>
          {venue.venueCode ? (
            <p className="font-mono text-xs uppercase tracking-widest text-electric-yellow">
              {venue.venueCode}
            </p>
          ) : null}
          <h3 className="font-display text-xl font-bold text-white">{venue.name}</h3>
          <p className="font-mono text-xs text-slate-400">{venue.city}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-white/20 px-2 py-1 font-mono text-xs text-slate-400 hover:text-white"
          aria-label="Cerrar panel"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 p-4">
        {venue.isPremium ? (
          <p className="text-xs font-bold uppercase text-electric-red">Top del Barrio</p>
        ) : null}
        {venue.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={venue.photoUrl} alt={venue.name} className="h-32 w-full rounded-lg object-cover" />
        ) : null}
        {venue.worlds50bestRank ? (
          <p className="text-xs font-bold uppercase text-electric-yellow">
            World&apos;s 50 Best #{venue.worlds50bestRank}
          </p>
        ) : null}
        {venue.regionalRank ? (
          <p className="text-xs font-bold uppercase text-electric-blue">
            Regional #{venue.regionalRank}
          </p>
        ) : null}
        {venue.verdict ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-200">{venue.verdict}</p>
        ) : null}
        {venue.history ? (
          <p className="line-clamp-4 text-sm text-slate-400">{venue.history}</p>
        ) : null}
        {venue.history || venue.verdict ? (
          <Link
            href={venue.profileUrl}
            className="font-mono text-xs text-electric-blue hover:text-electric-yellow"
          >
            Leer más en la ficha →
          </Link>
        ) : null}
        {venue.tripadvisorRating != null ? (
          <p className="font-mono text-xs text-slate-400">
            TripAdvisor {venue.tripadvisorRating.toFixed(1)}★
          </p>
        ) : null}
        {venue.geocodeConfidence === "low" ? (
          <p className="font-mono text-xs text-amber-500">Ubicación aproximada</p>
        ) : null}
        {venue.address ? (
          <p className="font-mono text-sm text-slate-300">{venue.address}</p>
        ) : null}
        <div className="flex flex-col gap-2">
          <Link
            href={venue.profileUrl}
            className="inline-block w-full rounded-full border-2 border-black bg-electric-yellow px-4 py-2 text-center font-mono text-xs font-bold uppercase tracking-wider text-black shadow-[3px_3px_0px_#000000]"
          >
            Ver ficha
          </Link>
          {venue.externalWebsite ? (
            <a
              href={venue.externalWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full rounded-full border-2 border-white/20 px-4 py-2 text-center font-mono text-xs font-bold uppercase tracking-wider text-slate-300 hover:border-electric-blue hover:text-white"
            >
              Web oficial
            </a>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
