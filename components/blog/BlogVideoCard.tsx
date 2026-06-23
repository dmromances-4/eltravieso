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

type Props = { item: Item };

export default function BlogVideoCard({ item }: Props) {
  const duration = formatDuration(item.durationSecs);

  return (
    <Link
      href={`/blog/video/${item.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#121212] transition-all hover:-translate-y-2 hover:border-electric-red/30"
    >
      <div className="relative h-48 w-full bg-black/40">
        {item.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.coverUrl} alt="" className="h-full w-full object-cover opacity-90" />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-electric-red/90 text-2xl text-white shadow-lg">
            ▶
          </span>
        </div>
        {duration ? (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">
            {duration}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col p-8">
        <h2 className="mb-3 font-display text-xl font-bold text-white group-hover:text-electric-red">{item.title}</h2>
        {item.summary ? <p className="line-clamp-2 text-sm text-slate-400">{item.summary}</p> : null}
        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-slate-500">{item.editorialAuthor.name}</p>
      </div>
    </Link>
  );
}
