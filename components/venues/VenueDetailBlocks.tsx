import type { VenuePublicDTO } from "@/lib/venues/types";
import {
  labelForPriceRange,
  labelForVenueOption,
  VENUE_PREFERENCE_GROUPS,
} from "@/lib/venues/taxonomy";

type Props = { venue: VenuePublicDTO };

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((id) => (
        <span
          key={id}
          className="border-2 border-black bg-black px-3 py-1 font-mono text-xs uppercase text-electric-yellow"
        >
          {labelForVenueOption(id)}
        </span>
      ))}
    </div>
  );
}

function PreferenceGroups({ venue }: { venue: VenuePublicDTO }) {
  const hasPrefs = venue.venuePreferences.length > 0;
  const hasDressCode = Boolean(venue.dressCode?.trim());

  if (!hasPrefs && !hasDressCode) return null;

  return (
    <section className="border-4 border-black bg-zinc-900 p-8 shadow-[6px_6px_0px_#000000]">
      <h2 className="mb-6 font-display text-3xl font-bold uppercase text-white">Preferencias</h2>
      <div className="space-y-6">
        {VENUE_PREFERENCE_GROUPS.map((group) => {
          const active = group.options.filter((o) => venue.venuePreferences.includes(o.id));
          if (active.length === 0) return null;
          return (
            <div key={group.id}>
              <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-slate-500">
                {group.title}
              </h3>
              <TagList items={active.map((o) => o.id)} />
            </div>
          );
        })}
        {venue.venuePreferences.includes("dress_code") && venue.dressCode ? (
          <p className="font-mono text-sm text-slate-300">
            <span className="text-slate-500">Dress code: </span>
            {venue.dressCode}
          </p>
        ) : hasDressCode && !venue.venuePreferences.includes("dress_code") ? (
          <p className="font-mono text-sm text-slate-300">
            <span className="text-slate-500">Dress code: </span>
            {venue.dressCode}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default function VenueDetailBlocks({ venue }: Props) {
  const hasIdentity =
    venue.establishmentTypes.length > 0 ||
    venue.cuisineTypes.length > 0 ||
    venue.starDishes.length > 0;
  const hasAmbiance =
    venue.idealFor.length > 0 || venue.venueFeatures.length > 0 || venue.neighborhood;
  const hasValue =
    venue.priceRange ||
    venue.dailyMenuEnabled ||
    venue.awards.length > 0;
  const hasLinks = venue.instagramUrl || venue.tiktokUrl || venue.tripadvisorUrl || venue.theForkUrl;

  const hasPrefsSection =
    venue.venuePreferences.length > 0 || Boolean(venue.dressCode?.trim());

  if (!hasIdentity && !hasAmbiance && !hasValue && !hasLinks && !hasPrefsSection) {
    return null;
  }

  return (
    <div className="space-y-8">
      {hasIdentity ? (
        <section className="border-4 border-black bg-black p-8 shadow-[6px_6px_0px_#000000]">
          <h2 className="mb-6 font-display text-3xl font-bold uppercase text-electric-yellow">
            Gastronomía
          </h2>
          <div className="space-y-5">
            {venue.establishmentTypes.length > 0 ? (
              <div>
                <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-slate-500">
                  Tipo de establecimiento
                </h3>
                <TagList items={venue.establishmentTypes} />
              </div>
            ) : null}
            {venue.cuisineTypes.length > 0 ? (
              <div>
                <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-slate-500">
                  Cocina
                </h3>
                <TagList items={venue.cuisineTypes} />
              </div>
            ) : null}
            {venue.starDishes.length > 0 ? (
              <div>
                <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-slate-500">
                  Especialidades
                </h3>
                <ul className="list-inside list-disc font-mono text-sm text-slate-300">
                  {venue.starDishes.map((dish) => (
                    <li key={dish}>{dish}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {hasAmbiance ? (
        <section className="border-4 border-black bg-zinc-900 p-8 shadow-[6px_6px_0px_#000000]">
          <h2 className="mb-6 font-display text-3xl font-bold uppercase text-electric-blue">
            Ambiente
          </h2>
          <div className="space-y-5">
            {venue.neighborhood ? (
              <p className="font-mono text-sm text-slate-300">
                <span className="text-slate-500">Zona: </span>
                {venue.neighborhood}
              </p>
            ) : null}
            {venue.idealFor.length > 0 ? (
              <div>
                <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-slate-500">
                  Ideal para
                </h3>
                <TagList items={venue.idealFor} />
              </div>
            ) : null}
            {venue.venueFeatures.length > 0 ? (
              <div>
                <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-slate-500">
                  Características
                </h3>
                <TagList items={venue.venueFeatures} />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {hasValue ? (
        <section className="border-4 border-black bg-electric-red p-8 shadow-[6px_6px_0px_#000000]">
          <h2 className="mb-6 font-display text-3xl font-bold uppercase text-white">Precios</h2>
          <dl className="space-y-3 font-mono text-sm text-white">
            {venue.priceRange ? (
              <div>
                <dt className="text-xs uppercase tracking-widest text-white/70">Ticket medio</dt>
                <dd className="text-lg font-bold">{labelForPriceRange(venue.priceRange)}</dd>
              </div>
            ) : null}
            {venue.dailyMenuEnabled ? (
              <div>
                <dt className="text-xs uppercase tracking-widest text-white/70">Menú del día</dt>
                <dd>{venue.dailyMenuNote || "Sí"}</dd>
              </div>
            ) : null}
            {venue.awards.length > 0 ? (
              <div>
                <dt className="mb-2 text-xs uppercase tracking-widest text-white/70">Galardones</dt>
                <dd>
                  <TagList items={venue.awards} />
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      <PreferenceGroups venue={venue} />

      {hasLinks ? (
        <section className="border-4 border-black bg-black p-8 shadow-[6px_6px_0px_#000000]">
          <h2 className="mb-6 font-display text-3xl font-bold uppercase text-electric-yellow">
            Enlaces
          </h2>
          <ul className="space-y-2 font-mono text-sm">
            {venue.instagramUrl ? (
              <li>
                <a
                  href={venue.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-electric-yellow underline"
                >
                  Instagram
                </a>
              </li>
            ) : null}
            {venue.tiktokUrl ? (
              <li>
                <a
                  href={venue.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-electric-yellow underline"
                >
                  TikTok
                </a>
              </li>
            ) : null}
            {venue.tripadvisorUrl ? (
              <li>
                <a
                  href={venue.tripadvisorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-electric-yellow underline"
                >
                  TripAdvisor
                  {venue.tripadvisorRating != null ? ` (${venue.tripadvisorRating.toFixed(1)}★)` : ""}
                </a>
              </li>
            ) : null}
            {venue.theForkUrl ? (
              <li>
                <a
                  href={venue.theForkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-electric-yellow underline"
                >
                  TheFork
                </a>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
