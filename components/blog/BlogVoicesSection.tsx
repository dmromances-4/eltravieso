import { Link } from "@/i18n/navigation";
import EditorialAuthorCard from "@/components/blog/EditorialAuthorCard";

type Author = {
  slug: string;
  name: string;
  tagline: string | null;
  avatarUrl: string | null;
  tier: string;
};

type Props = {
  authors: Author[];
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
};

export default function BlogVoicesSection({ authors, title, viewAllHref, viewAllLabel }: Props) {
  if (!authors.length) return null;

  return (
    <section className="mb-16 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
        {viewAllHref && viewAllLabel ? (
          <Link
            href={viewAllHref}
            className="text-xs font-bold uppercase tracking-widest text-electric-yellow hover:text-electric-blue"
          >
            {viewAllLabel} →
          </Link>
        ) : null}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {authors.map((author) => (
          <EditorialAuthorCard key={author.slug} author={author} />
        ))}
      </div>
    </section>
  );
}
