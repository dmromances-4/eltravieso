"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { CONTINENT_FILTER_OPTIONS, type ContinentFilter } from "@/lib/venues/continents";
import { VENUE_TYPE_COLORS } from "@/components/map/map-constants";

const VENUE_TYPE_KEYS: Record<string, string> = {
  cocteleria: "venueTypeCocteleria",
  restaurante: "venueTypeRestaurante",
  bar: "venueTypeBar",
  bodega: "venueTypeBodega",
};

type Props = {
  affiliatesCount: number;
  editorialCount: number;
  showAffiliates: boolean;
  showEditorial: boolean;
  onToggleAffiliates: (value: boolean) => void;
  onToggleEditorial: (value: boolean) => void;
  continent: ContinentFilter;
  onContinentChange: (value: ContinentFilter) => void;
  hideLowConfidence: boolean;
  onHideLowConfidenceChange: (value: boolean) => void;
  onLocateUser?: () => void;
  locating?: boolean;
};

export default function VenueMapControls({
  affiliatesCount,
  editorialCount,
  showAffiliates,
  showEditorial,
  onToggleAffiliates,
  onToggleEditorial,
  continent,
  onContinentChange,
  hideLowConfidence,
  onHideLowConfidenceChange,
  onLocateUser,
  locating,
}: Props) {
  const t = useTranslations("map");

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-card border border-slate-200 bg-white p-4 text-xs font-bold uppercase tracking-widest shadow-sm">
      <label className="flex cursor-pointer items-center gap-2 text-slate-600">
        <input
          type="checkbox"
          checked={showAffiliates}
          onChange={(e) => onToggleAffiliates(e.target.checked)}
          className="accent-electric-yellow"
        />
        {t("affiliatesLayer")} ({affiliatesCount})
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-slate-600">
        <input
          type="checkbox"
          checked={showEditorial}
          onChange={(e) => onToggleEditorial(e.target.checked)}
          className="accent-electric-yellow"
        />
        {t("editorialLayer")} ({editorialCount})
      </label>
      <label className="flex items-center gap-2 border-l border-slate-200 pl-4 text-slate-600">
        <span>{t("continent")}</span>
        <select
          value={continent}
          onChange={(e) => onContinentChange(e.target.value as ContinentFilter)}
          className="rounded border border-slate-200 bg-white px-2 py-1 font-mono text-xs normal-case text-slate-800"
        >
          {CONTINENT_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex cursor-pointer items-center gap-2 border-l border-slate-200 pl-4 text-slate-600">
        <input
          type="checkbox"
          checked={hideLowConfidence}
          onChange={(e) => onHideLowConfidenceChange(e.target.checked)}
          className="accent-electric-blue"
        />
        {t("reliableOnly")}
      </label>
      {onLocateUser ? (
        <button
          type="button"
          onClick={onLocateUser}
          disabled={locating}
          className="border-l border-slate-200 pl-4 text-electric-blue hover:text-electric-yellow disabled:opacity-50"
        >
          {locating ? t("locating") : t("myLocation")}
        </button>
      ) : null}
      <div className="flex flex-wrap gap-4 border-l border-slate-200 pl-4">
        {Object.entries(VENUE_TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-2 text-slate-500">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            {VENUE_TYPE_KEYS[type] ? t(VENUE_TYPE_KEYS[type]) : type}
          </span>
        ))}
      </div>
    </div>
  );
}

export function VenueNearbyList({
  items,
}: {
  items: { venue: { slug: string; name: string; city: string; profileUrl: string }; km: number }[];
}) {
  const t = useTranslations("map");

  if (items.length === 0) return null;
  return (
    <div className="rounded-card border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-electric-blue">
        {t("nearYou")}
      </h3>
      <ul className="space-y-2">
        {items.map(({ venue, km }) => (
          <li key={venue.slug}>
            <Link
              href={venue.profileUrl}
              className="flex items-center justify-between gap-2 font-mono text-sm text-slate-700 hover:text-electric-blue"
            >
              <span>
                {venue.name}
                <span className="block text-xs text-slate-500">{venue.city}</span>
              </span>
              <span className="shrink-0 text-xs text-slate-500">{km < 1 ? "<1" : Math.round(km)} km</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
