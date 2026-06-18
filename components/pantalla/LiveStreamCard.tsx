import { Link } from "@/i18n/navigation";
import type { LiveCategory } from "@prisma/client";
import { LIVE_CATEGORY_LABELS } from "@/lib/media/types";

type LiveStreamCardProps = {
  slug: string;
  title: string;
  category: LiveCategory;
  embedUrl: string;
  summary?: string | null;
};

export default function LiveStreamCard({ slug, title, category, summary }: LiveStreamCardProps) {
  return (
    <Link
      href={`/pantalla/directo#${slug}`}
      className="block rounded-[1.5rem] border border-red-500/30 bg-[#121212] p-5 transition hover:border-red-400"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">En directo</span>
        <span className="text-[10px] uppercase tracking-widest text-slate-500">
          {LIVE_CATEGORY_LABELS[category]}
        </span>
      </div>
      <h3 className="mt-3 font-display text-xl font-bold text-white">{title}</h3>
      {summary ? <p className="mt-2 line-clamp-2 text-sm text-slate-400">{summary}</p> : null}
    </Link>
  );
}
