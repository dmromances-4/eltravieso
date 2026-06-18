import type { VenuePublicDTO } from "@/lib/venues/types";

type Props = { venue: VenuePublicDTO };

export default function VenueLoreBlocks({ venue }: Props) {
  return (
    <div className="space-y-8">
      {venue.verdict ? (
        <section className="border-4 border-black bg-electric-red p-8 shadow-[8px_8px_0px_#000000]">
          <h2 className="mb-4 font-display text-3xl font-bold uppercase text-white">El Veredicto</h2>
          <p className="font-mono text-base leading-relaxed text-white/95">{venue.verdict}</p>
        </section>
      ) : null}

      {venue.history ? (
        <section className="border-4 border-black bg-zinc-900 p-8 shadow-[6px_6px_0px_#000000]">
          <h2 className="mb-4 font-display text-3xl font-bold uppercase text-electric-yellow">Historia</h2>
          <div className="space-y-4 font-mono text-sm leading-relaxed text-slate-300">
            {venue.history.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          {venue.foundationYear ? (
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-slate-500">
              Fundado en {venue.foundationYear}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="border-4 border-black bg-black p-8 shadow-[6px_6px_0px_#000000]">
        <h2 className="mb-6 font-display text-3xl font-bold uppercase text-electric-blue">Intel</h2>
        <dl className="grid gap-4 font-mono text-sm sm:grid-cols-2">
          {venue.venueCode ? (
            <div>
              <dt className="text-xs uppercase tracking-widest text-slate-500">Código local</dt>
              <dd className="font-bold text-electric-yellow">{venue.venueCode}</dd>
            </div>
          ) : null}
          {venue.address ? (
            <div>
              <dt className="text-xs uppercase tracking-widest text-slate-500">Dirección</dt>
              <dd className="text-slate-200">{venue.address}</dd>
            </div>
          ) : null}
          {venue.chefName ? (
            <div>
              <dt className="text-xs uppercase tracking-widest text-slate-500">Chef</dt>
              <dd className="text-slate-200">{venue.chefName}</dd>
            </div>
          ) : null}
          {venue.signatureDrink ? (
            <div>
              <dt className="text-xs uppercase tracking-widest text-slate-500">Bebida insignia</dt>
              <dd className="text-slate-200">{venue.signatureDrink}</dd>
            </div>
          ) : null}
          {venue.dressCode && !venue.venuePreferences.includes("dress_code") ? (
            <div>
              <dt className="text-xs uppercase tracking-widest text-slate-500">Dress code</dt>
              <dd className="text-slate-200">{venue.dressCode}</dd>
            </div>
          ) : null}
          {venue.phone ? (
            <div>
              <dt className="text-xs uppercase tracking-widest text-slate-500">Teléfono</dt>
              <dd className="text-slate-200">{venue.phone}</dd>
            </div>
          ) : null}
          {venue.email ? (
            <div>
              <dt className="text-xs uppercase tracking-widest text-slate-500">Email</dt>
              <dd className="text-slate-200">{venue.email}</dd>
            </div>
          ) : null}
          {venue.googleBusinessId ? (
            <div>
              <dt className="text-xs uppercase tracking-widest text-slate-500">Google Business</dt>
              <dd className="text-slate-200">{venue.googleBusinessId}</dd>
            </div>
          ) : null}
          {venue.tripadvisorPlaceId && !venue.tripadvisorUrl ? (
            <div>
              <dt className="text-xs uppercase tracking-widest text-slate-500">TripAdvisor ID</dt>
              <dd className="text-slate-200">{venue.tripadvisorPlaceId}</dd>
            </div>
          ) : null}
          {venue.sourceUrl ? (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-widest text-slate-500">Fuente</dt>
              <dd className="truncate text-slate-400">
                <a href={venue.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-electric-yellow">
                  {venue.sourceUrl}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      {venue.source === "editorial" && venue.sourceUrl ? (
        <footer className="border-4 border-dashed border-slate-600 p-4 text-center font-mono text-xs text-slate-500">
          Ranking y texto adaptado de{" "}
          <a
            href={venue.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-electric-yellow underline"
          >
            The World&apos;s 50 Best
          </a>
          . © William Reed Business Media.
        </footer>
      ) : null}
    </div>
  );
}
