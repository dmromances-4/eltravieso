"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CONTINENT_LABELS } from "@/lib/venues/continents";
import type { VenueContinent } from "@prisma/client";

function MapLoadingFallback() {
  const t = useTranslations("map");
  return (
    <div className="flex h-[70vh] items-center justify-center rounded-card border border-slate-200 bg-white text-slate-500 shadow-sm">
      {t("loadingMap")}
    </div>
  );
}

const VenueMapShell = dynamic(() => import("@/components/map/VenueMapShell"), {
  ssr: false,
  loading: () => <MapLoadingFallback />,
});

type EditorialVenue = {
  slug: string;
  name: string;
  city: string;
  worlds50bestRank: number;
  worlds50bestCategory: string;
  regionalRank?: number | null;
};

type ContinentalSection = {
  continent: VenueContinent;
  venues: EditorialVenue[];
};

type Props = {
  editorialIndex?: EditorialVenue[];
  continentalSections?: ContinentalSection[];
  initialSlug?: string | null;
};

function VenueList({ venues }: { venues: EditorialVenue[] }) {
  const t = useTranslations("map");

  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {venues.map((v) => (
        <li key={v.slug}>
          <Link
            href={`/locales/${v.slug}`}
            className="block rounded-card border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-800 transition hover:border-electric-blue hover:bg-white"
          >
            {v.regionalRank ? (
              <span className="text-electric-blue">{t("regionalRank", { rank: v.regionalRank })}</span>
            ) : (
              <span className="text-electric-yellow">#{v.worlds50bestRank}</span>
            )}{" "}
            {v.name}
            <span className="block text-xs text-slate-500">{v.city}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function MapaPageClient({
  editorialIndex = [],
  continentalSections = [],
  initialSlug = null,
}: Props) {
  const t = useTranslations("map");

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

        <VenueMapShell initialSlug={initialSlug} />

        {continentalSections.length > 0
          ? continentalSections.map((section) => (
              <section
                key={section.continent}
                className="rounded-card border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="mb-4 font-display text-2xl font-bold text-slate-900">
                  {CONTINENT_LABELS[section.continent]}
                </h2>
                <VenueList venues={section.venues} />
              </section>
            ))
          : null}

        {editorialIndex.length > 0 && continentalSections.length === 0 ? (
          <section className="rounded-card border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-display text-2xl font-bold text-slate-900">
              {t("worlds50Best")}
            </h2>
            <VenueList venues={editorialIndex} />
          </section>
        ) : null}
      </div>
    </main>
  );
}
