"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import VenueDirectorySearch from "@/components/map/VenueDirectorySearch";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import VenueMapShell from "@/components/map/VenueMapShell";
import { labelForVenueOption } from "@/lib/venues/taxonomy";
import {
  filterEditorialIndexVenues,
  sortEditorialIndexVenues,
} from "@/lib/venues/sort-editorial-index";

const INDEX_PAGE_SIZE = 50;

function MapChunkError({ retry }: { retry: () => void }) {
  const t = useTranslations("map");
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center gap-4 rounded-card border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-slate-700">{t("loadError")}</p>
      <button
        type="button"
        onClick={retry}
        className="rounded-pill border border-electric-yellow bg-electric-yellow/20 px-6 py-2 text-sm font-bold uppercase tracking-widest text-slate-900 transition hover:bg-electric-yellow/40"
      >
        {t("retry")}
      </button>
    </div>
  );
}

type EditorialVenue = {
  slug: string;
  name: string;
  city: string;
  worlds50bestRank: number;
  worlds50bestCategory: string;
  listScope?: string;
  regionalRank?: number | null;
  regionTags?: string[];
  venuePreferences?: string[];
};

type Props = {
  initialSlug?: string | null;
};

function VenueListSkeleton() {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: 9 }).map((_, i) => (
        <li
          key={i}
          className="h-20 animate-pulse rounded-card border border-slate-200 bg-slate-100"
        />
      ))}
    </ul>
  );
}

function VenueList({ venues }: { venues: EditorialVenue[] }) {
  const t = useTranslations("map");

  if (venues.length === 0) {
    return <p className="font-mono text-sm text-slate-500">{t("noResults")}</p>;
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {venues.map((v) => (
        <li key={v.slug}>
          <Link
            href={`/locales/${v.slug}`}
            className="block rounded-card border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-800 transition hover:border-electric-blue hover:bg-white"
          >
            <span className="text-electric-yellow">#{v.worlds50bestRank}</span>{" "}
            {v.name}
            <span className="block text-xs text-slate-500">
              {v.city}
              {v.worlds50bestCategory ? (
                <span className="ml-2 uppercase tracking-wide text-slate-400">
                  · {v.worlds50bestCategory}
                </span>
              ) : null}
            </span>
            {v.regionTags && v.regionTags.length > 0 ? (
              <span className="mt-1 flex flex-wrap gap-1">
                {v.regionTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-pill border border-electric-blue/30 bg-electric-blue/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-electric-blue"
                  >
                    {tag}
                  </span>
                ))}
              </span>
            ) : null}
            {v.venuePreferences && v.venuePreferences.length > 0 ? (
              <span className="mt-1 flex flex-wrap gap-1">
                {v.venuePreferences.slice(0, 4).map((pref) => (
                  <span
                    key={pref}
                    className="rounded-pill border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {labelForVenueOption(pref)}
                  </span>
                ))}
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function MapaPageClient({ initialSlug = null }: Props) {
  const t = useTranslations("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [editorialIndex, setEditorialIndex] = useState<EditorialVenue[]>([]);
  const [indexLoading, setIndexLoading] = useState(true);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [indexReloadToken, setIndexReloadToken] = useState(0);
  const [showAllList, setShowAllList] = useState(false);
  const [mapChunkKey, setMapChunkKey] = useState(0);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setShowAllList(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIndexLoading(true);
    setIndexError(null);

    void (async () => {
      try {
        const response = await fetch("/api/venues/index");
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(payload.message ?? `HTTP ${response.status}`);
        }
        const data = (await response.json()) as { venues?: EditorialVenue[] };
        if (!cancelled) {
          setEditorialIndex(data.venues ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : t("indexLoadError");
          setIndexError(message);
          setEditorialIndex([]);
        }
      } finally {
        if (!cancelled) setIndexLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [indexReloadToken, t]);

  const filteredVenues = useMemo(
    () =>
      sortEditorialIndexVenues(filterEditorialIndexVenues(editorialIndex, searchQuery)),
    [editorialIndex, searchQuery],
  );

  const isSearching = Boolean(searchQuery.trim());
  const visibleListVenues = useMemo(() => {
    if (isSearching || showAllList) return filteredVenues;
    return filteredVenues.slice(0, INDEX_PAGE_SIZE);
  }, [filteredVenues, isSearching, showAllList]);

  const hasMore = !isSearching && !showAllList && visibleListVenues.length < filteredVenues.length;

  return (
    <main className="min-h-screen bg-[#FAFAFA] pb-12 pt-28 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8 px-6 sm:px-8">
        <section className="space-y-4">
          <span className="eyebrow inline-flex rounded-pill border border-electric-yellow/30 bg-electric-yellow/10 px-4 py-2">
            {t("eyebrow")}
          </span>
          <h1 className="text-display">{t("title")}</h1>
          <p className="max-w-2xl text-body">{t("lead")}</p>
        </section>

        <VenueDirectorySearch
          value={searchQuery}
          onChange={handleSearchChange}
          resultCount={isSearching ? filteredVenues.length : undefined}
        />

        <MapErrorBoundary
          key={mapChunkKey}
          fallback={({ retry }) => (
            <MapChunkError
              retry={() => {
                retry();
                setMapChunkKey((k) => k + 1);
              }}
            />
          )}
        >
          <VenueMapShell initialSlug={initialSlug} searchQuery={searchQuery} />
        </MapErrorBoundary>

        <section className="rounded-card border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-2xl font-bold text-slate-900">{t("worlds50Best")}</h2>
            {!indexLoading && !indexError ? (
              <span className="font-mono text-xs text-slate-500">
                {visibleListVenues.length} / {filteredVenues.length}
              </span>
            ) : null}
          </div>
          {indexLoading ? (
            <VenueListSkeleton />
          ) : indexError ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-slate-600">{t("indexLoadError")}</p>
              <p className="font-mono text-xs text-slate-500">{indexError}</p>
              <button
                type="button"
                onClick={() => setIndexReloadToken((n) => n + 1)}
                className="rounded-pill border border-electric-yellow bg-electric-yellow/20 px-6 py-2 text-sm font-bold uppercase tracking-widest text-slate-900 transition hover:bg-electric-yellow/40"
              >
                {t("retry")}
              </button>
            </div>
          ) : (
            <>
              <VenueList venues={visibleListVenues} />
              {hasMore ? (
                <button
                  type="button"
                  onClick={() => setShowAllList(true)}
                  className="mt-4 w-full rounded-card border border-slate-200 bg-slate-50 py-3 font-mono text-sm font-semibold text-slate-700 transition hover:border-electric-blue hover:bg-white"
                >
                  {t("showAll")} ({filteredVenues.length})
                </button>
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
