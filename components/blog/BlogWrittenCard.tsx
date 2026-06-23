import { Link } from "@/i18n/navigation";

type Post = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  isPremium: boolean;
  ingestionType: string | null;
  author: { name: string | null } | null;
  editorialAuthor: { name: string; slug: string; avatarUrl: string | null } | null;
};

type Props = { post: Post; excerptBadge?: string };

export default function BlogWrittenCard({ post, excerptBadge }: Props) {
  const authorName = post.editorialAuthor?.name ?? post.author?.name ?? "Autor";
  const date = post.publishedAt ?? post.createdAt;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#121212] transition-all duration-300 hover:-translate-y-2 hover:border-electric-blue/30 hover:shadow-[0_0_40px_rgba(43,135,185,0.15)]"
    >
      {post.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverUrl} alt="" className="h-48 w-full object-cover" />
      ) : null}
      <div className="flex flex-grow flex-col p-8">
        <div className="mb-6 flex items-center justify-between gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {date.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
          </span>
          <div className="flex items-center gap-2">
            {post.ingestionType === "syndicated" && excerptBadge ? (
              <span className="rounded-full border border-electric-blue/30 bg-electric-blue/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-electric-blue">
                {excerptBadge}
              </span>
            ) : null}
            {post.isPremium ? (
              <span className="rounded-full border border-electric-red/40 bg-electric-red/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-electric-red">
                VIP
              </span>
            ) : null}
          </div>
        </div>
        <h2 className="mb-4 font-display text-2xl font-bold text-white transition-colors group-hover:text-electric-blue">
          {post.title}
        </h2>
        {post.excerpt ? (
          <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-slate-400">{post.excerpt}</p>
        ) : null}
        <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-electric-yellow/20 font-display font-bold text-electric-yellow">
            {authorName.charAt(0)}
          </div>
          {post.editorialAuthor ? (
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">{authorName}</span>
          ) : (
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">{authorName}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
