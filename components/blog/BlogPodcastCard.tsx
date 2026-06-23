import { Link } from "@/i18n/navigation";
import { formatDuration } from "@/lib/blog/catalog";

type Item = {
  slug: string;
  title: string;
  summary: string | null;
  coverUrl: string | null;
  publishedAt: Date | null;
  durationSecs: number | null;
  editorialAuthor: { name: string; slug: string };
};

type Props = { item: Item; episodeLabel?: string };

export default function BlogPodcastCard({ item, episodeLabel }: Props) {
  const duration = formatDuration(item.durationSecs);

  return (
    <Link
      href={`/blog/podcast/${item.slug}`}
      className="group flex flex-col rounded-[2rem] border border-white/10 bg-[#121212] p-6 transition-all hover:-translate-y-1 hover:border-electric-blue/30"
    >
      <div className="mb-4 flex items-start gap-4">
        {item.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.coverUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-electric-blue/20 text-2xl">🎙</div>
        )}
        <div className="min-w-0 flex-1">
          {episodeLabel ? (
            <span className="text-[10px] font-bold uppercase tracking-widest text-electric-blue">{episodeLabel}</span>
          ) : null}
          <h2 className="font-display text-lg font-bold text-white group-hover:text-electric-blue">{item.title}</h2>
          <p className="mt-1 text-xs text-slate-500">{item.editorialAuthor.name}</p>
        </div>
      </div>
      {item.summary ? <p className="line-clamp-3 text-sm text-slate-400">{item.summary}</p> : null}
      {duration ? (
        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">{duration}</p>
      ) : null}
    </Link>
  );
}
