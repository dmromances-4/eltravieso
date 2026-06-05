import Image from "next/image";
import { REGIONAL_LIST_LABELS } from "@/lib/venues/continents";
import type { VenuePublicDTO } from "@/lib/venues/types";

const VENUE_LABELS: Record<string, string> = {
  cocteleria: "Coctelería",
  restaurante: "Restaurante",
  bar: "Bar",
  bodega: "Bodega",
};

const CATEGORY_LABELS = {
  BARS: "World's 50 Best Bars",
  RESTAURANTS: "World's 50 Best Restaurants",
} as const;

function regionalBadgeLabel(venue: VenuePublicDTO): string | null {
  const regional = venue.additionalRankings.find((r) => r.scope === "REGIONAL");
  if (regional) {
    const label =
      REGIONAL_LIST_LABELS[regional.continent]?.[regional.category] ??
      `${regional.continent} ${regional.category}`;
    return `#${regional.rank} ${label}`;
  }
  if (venue.regionalRank && venue.continent && venue.continent !== "GLOBAL") {
    const label =
      REGIONAL_LIST_LABELS[venue.continent]?.[venue.worlds50bestCategory ?? "BARS"] ??
      venue.continent;
    return `#${venue.regionalRank} ${label}`;
  }
  return null;
}

type Props = { venue: VenuePublicDTO };

export default function VenueHero({ venue }: Props) {
  const typeLabel = VENUE_LABELS[venue.venueType] ?? venue.venueType;
  const regionalBadge = regionalBadgeLabel(venue);

  return (
    <section className="border-4 border-black bg-zinc-900 shadow-[10px_10px_0px_#000000]">
      <div className="grid gap-0 md:grid-cols-2">
        <div className="relative aspect-[4/3] min-h-[280px] border-b-4 border-black md:border-b-0 md:border-r-4">
          {venue.photoUrl ? (
            <Image
              src={venue.photoUrl}
              alt={venue.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-black font-mono text-slate-500">
              Sin foto
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center gap-4 p-8">
          <div className="flex flex-wrap gap-2">
            {venue.worlds50bestRank ? (
              <span className="inline-flex w-fit border-4 border-black bg-electric-yellow px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-black shadow-[4px_4px_0px_#000000]">
                #{venue.worlds50bestRank}{" "}
                {venue.worlds50bestCategory
                  ? CATEGORY_LABELS[venue.worlds50bestCategory]
                  : "World's 50 Best"}
              </span>
            ) : null}
            {regionalBadge ? (
              <span className="inline-flex w-fit border-4 border-black bg-electric-blue px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-black shadow-[4px_4px_0px_#000000]">
                {regionalBadge}
              </span>
            ) : null}
            {venue.isPremium ? (
              <span className="inline-flex w-fit border-4 border-black bg-electric-red px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-white shadow-[4px_4px_0px_#000000]">
                Top del Barrio
              </span>
            ) : null}
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-electric-yellow">{typeLabel}</p>
          <h1 className="font-display text-4xl font-bold uppercase leading-tight text-white sm:text-5xl">
            {venue.name}
          </h1>
          <p className="font-mono text-lg text-slate-300">
            {venue.city}
            {venue.country ? `, ${venue.country}` : ""}
          </p>
          {venue.vibeTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {venue.vibeTags.map((tag) => (
                <span
                  key={tag}
                  className="border-2 border-black bg-black px-3 py-1 font-mono text-xs uppercase text-electric-yellow"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
