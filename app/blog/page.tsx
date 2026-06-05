import Link from "next/link";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog | Vermut El Travieso",
  description: "Artículos, recetas y la cultura más canalla del vermut.",
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    include: {
      author: { select: { name: true } },
    },
  });

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 text-white">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="mb-16 space-y-4">
          <p className="inline-flex rounded-full border border-electric-blue/20 bg-electric-blue/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-electric-blue">
            Cultura Canalla
          </p>
          <h1 className="text-5xl font-display font-bold tracking-tight text-white sm:text-6xl">
            Diario de un <span className="text-electric-yellow italic pr-2">Travieso</span>.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-400">
            Historias de barra, secretos de destilación y todo lo que no te cuentan sobre el vermut.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-slate-400">Pronto habrá artículos publicados por la comunidad.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#121212] transition-all duration-300 hover:-translate-y-2 hover:border-electric-blue/30 hover:shadow-[0_0_40px_rgba(0,163,224,0.15)]"
              >
                {post.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.coverUrl} alt="" className="h-48 w-full object-cover" />
                ) : null}
                <div className="flex flex-grow flex-col p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {(post.publishedAt ?? post.createdAt).toLocaleDateString("es-ES", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-electric-yellow">Leer →</span>
                  </div>

                  <h2 className="mb-4 font-display text-2xl font-bold text-white transition-colors group-hover:text-electric-blue">
                    {post.title}
                  </h2>

                  {post.excerpt ? (
                    <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-slate-400">{post.excerpt}</p>
                  ) : null}

                  <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-electric-yellow/20 font-display font-bold text-electric-yellow">
                      {(post.author?.name ?? "U").charAt(0)}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
                      {post.author?.name ?? "Autor"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
