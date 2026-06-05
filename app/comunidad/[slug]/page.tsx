import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import CommentForm from "@/components/forum/CommentForm";

export const dynamic = "force-dynamic";

export default async function ComunidadTopicPage({ params }: { params: { slug: string } }) {
  const topic = await prisma.forumTopic.findUnique({
    where: { slug: params.slug },
    include: {
      author: { select: { name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!topic) notFound();

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 text-white">
      <div className="mx-auto max-w-3xl px-6 sm:px-8">
        <Link
          href="/comunidad"
          className="mb-8 inline-flex text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-electric-yellow"
        >
          ← Volver al foro
        </Link>

        <article className="rounded-[2rem] border border-white/10 bg-[#121212] p-8">
          <h1 className="text-3xl font-display font-bold">{topic.title}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {topic.author.name ?? "Usuario"} · {new Date(topic.createdAt).toLocaleDateString("es-ES")}
          </p>
          <div className="prose prose-invert mt-8 max-w-none whitespace-pre-wrap text-slate-300">
            {topic.content}
          </div>
        </article>

        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-bold">Comentarios ({topic.comments.length})</h2>
          {topic.comments.length === 0 ? (
            <p className="text-slate-400">Sé el primero en responder.</p>
          ) : (
            topic.comments.map((comment) => (
              <div key={comment.id} className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {comment.author.name ?? "Usuario"} · {new Date(comment.createdAt).toLocaleDateString("es-ES")}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-slate-300">{comment.content}</p>
              </div>
            ))
          )}
          <div className="mt-6">
            <CommentForm topicSlug={topic.slug} />
          </div>
        </section>
      </div>
    </main>
  );
}
