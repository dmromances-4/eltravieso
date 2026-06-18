import { Link } from "@/i18n/navigation";
import prisma from "@/lib/prisma";
import AdminPostsList from "@/components/admin/AdminPostsList";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { email: true, name: true } },
    },
  });

  const mapped = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    published: post.published,
    isPremium: post.isPremium,
    updatedAt: post.updatedAt.toISOString(),
    author: post.author,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-white">Blog</h1>
          <p className="mt-2 text-slate-400">Gestiona artículos SEO y contenido editorial.</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="rounded-full bg-electric-red px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:brightness-110"
        >
          Nuevo artículo
        </Link>
      </div>

      <AdminPostsList posts={mapped} />
    </div>
  );
}
