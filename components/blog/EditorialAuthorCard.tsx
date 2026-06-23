import { Link } from "@/i18n/navigation";

type Author = {
  slug: string;
  name: string;
  tagline: string | null;
  avatarUrl: string | null;
  tier: string;
};

type Props = { author: Author };

export default function EditorialAuthorCard({ author }: Props) {
  const initial = author.name.charAt(0).toUpperCase();

  return (
    <Link
      href={`/blog/autores/${author.slug}`}
      className="group flex flex-col rounded-[2rem] border border-white/10 bg-[#121212] p-6 transition-all hover:-translate-y-1 hover:border-electric-yellow/30"
    >
      <div className="mb-4 flex items-center gap-4">
        {author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-electric-yellow/20 font-display text-xl font-bold text-electric-yellow">
            {initial}
          </div>
        )}
        <div>
          <h3 className="font-display text-lg font-bold text-white group-hover:text-electric-blue">{author.name}</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{author.tier}</span>
        </div>
      </div>
      {author.tagline ? (
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-400">{author.tagline}</p>
      ) : null}
    </Link>
  );
}
