import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedMediaBySlug } from "@/lib/media/catalog";
import { MEDIA_KIND_LABELS } from "@/lib/media/types";
import MediaPlayer from "@/components/pantalla/MediaPlayer";
import StarRating from "@/components/pantalla/StarRating";
import MediaComments from "@/components/pantalla/MediaComments";

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps) {
  const item = await getPublishedMediaBySlug(params.slug);
  if (!item) return { title: "Pantalla" };
  return { title: `${item.title} | Pantalla`, description: item.summary ?? undefined };
}

export default async function PantallaDetailPage({ params }: PageProps) {
  const item = await getPublishedMediaBySlug(params.slug);
  if (!item) notFound();

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-28 pb-20 text-white">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <Link href="/pantalla" className="text-sm text-electric-yellow hover:underline">
          ← Volver a Pantalla
        </Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
          {MEDIA_KIND_LABELS[item.kind]}
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold">{item.title}</h1>
        {item.summary ? <p className="mt-4 text-lg text-slate-300">{item.summary}</p> : null}

        <div className="mt-6">
          <StarRating slug={item.slug} initialAvg={item.ratingAvg} initialCount={item.ratingCount} />
        </div>

        <div className="mt-8">
          <MediaPlayer mediaUrl={item.mediaUrl} playbackUrl={item.playbackUrl} title={item.title} />
        </div>

        {item.cocktailSlugs.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-display text-2xl font-bold">Cócteles relacionados</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.cocktailSlugs.map((slug) => (
                <Link
                  key={slug}
                  href={`/recetas/${slug}`}
                  className="rounded-full border border-electric-yellow/30 px-4 py-2 text-sm text-electric-yellow hover:bg-electric-yellow/10"
                >
                  {slug}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {item.episodes.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-display text-2xl font-bold">Episodios</h2>
            <ul className="mt-4 space-y-2">
              {item.episodes.map((ep) => (
                <li key={ep.id}>
                  <Link href={`/pantalla/${ep.slug}`} className="text-slate-300 hover:text-white">
                    {ep.seasonNumber ? `T${ep.seasonNumber} · ` : ""}
                    {ep.episodeNumber ? `E${ep.episodeNumber} · ` : ""}
                    {ep.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-12">
          <MediaComments slug={item.slug} />
        </div>
      </div>
    </main>
  );
}
