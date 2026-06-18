import { listPublishedMedia, listPublishedLiveStreams } from "@/lib/media/catalog";
import PantallaHubClient from "@/components/pantalla/PantallaHubClient";
import LiveStreamCard from "@/components/pantalla/LiveStreamCard";
import { PageHero } from "@/components/ui/PageHero";
import { BrandLinkButton } from "@/components/ui/BrandButton";
import { Section } from "@/components/ui/Section";

export const metadata = {
  title: "Pantalla | El Travieso",
  description: "Películas, series, podcasts y eventos del mundo del cóctel.",
};

export default async function PantallaPage() {
  const [items, liveStreams] = await Promise.all([
    listPublishedMedia({ limit: 60 }),
    listPublishedLiveStreams(),
  ]);

  const hubItems = items
    .filter((i) => ["FILM", "SERIES", "PODCAST_SHOW", "EVENT_VIDEO"].includes(i.kind))
    .map((i) => ({
      slug: i.slug,
      title: i.title,
      kind: i.kind,
      coverUrl: i.coverUrl,
      summary: i.summary,
      ratingAvg: i.ratingAvg,
      cocktailSlugs: i.cocktailSlugs,
    }));

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-slate-900">
      <section className="pt-24 pb-8">
        <div className="section-shell flex flex-wrap items-end justify-between gap-6">
          <PageHero
            eyebrow="Pantalla"
            title="Cultura líquida"
            lead="Películas y series con cócteles icónicos, podcasts del sector, eventos de bares y directos."
          />
          <BrandLinkButton href="/pantalla/directo" variant="danger" className="shrink-0">
            En directo →
          </BrandLinkButton>
        </div>
      </section>

      {liveStreams.length > 0 ? (
        <Section compact alt>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {liveStreams.slice(0, 3).map((s) => (
              <LiveStreamCard
                key={s.id}
                slug={s.slug}
                title={s.title}
                category={s.category}
                embedUrl={s.embedUrl}
                summary={s.summary}
              />
            ))}
          </div>
        </Section>
      ) : null}

      <Section compact>
        <PantallaHubClient initialItems={hubItems} />
      </Section>
    </main>
  );
}
