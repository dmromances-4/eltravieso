import Link from "next/link";
import { listPublishedLiveStreams } from "@/lib/media/catalog";
import { LIVE_CATEGORY_LABELS } from "@/lib/media/types";
import MediaPlayer from "@/components/pantalla/MediaPlayer";

export const metadata = {
  title: "En directo | Pantalla",
  description: "Directos de golf, deportes y eventos en streaming.",
};

export default async function PantallaDirectoPage() {
  const streams = await listPublishedLiveStreams();

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-28 pb-20 text-white">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <Link href="/pantalla" className="text-sm text-electric-yellow hover:underline">
          ← Pantalla
        </Link>
        <h1 className="mt-6 font-display text-4xl font-bold">En directo</h1>
        <p className="mt-3 text-slate-400">Golf, deportes y eventos seleccionados por el equipo editorial.</p>

        {streams.length === 0 ? (
          <p className="mt-10 text-slate-500">No hay emisiones activas ahora mismo.</p>
        ) : (
          <div className="mt-10 space-y-12">
            {streams.map((stream) => (
              <section key={stream.id} id={stream.slug} className="scroll-mt-28 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-red-400">LIVE</span>
                  <span className="text-xs uppercase tracking-widest text-slate-500">
                    {LIVE_CATEGORY_LABELS[stream.category]}
                  </span>
                </div>
                <h2 className="font-display text-2xl font-bold">{stream.title}</h2>
                {stream.summary ? <p className="text-slate-400">{stream.summary}</p> : null}
                <MediaPlayer mediaUrl={stream.embedUrl} playbackUrl={stream.backupEmbedUrl} title={stream.title} />
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
