import { Link } from "@/i18n/navigation";
import prisma from "@/lib/prisma";
import CreateTopicForm from "@/components/forum/CreateTopicForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Comunidad | Vermut El Travieso",
  description: "Foro de profesionales de barra y coctelería.",
};

export default async function ComunidadPage() {
  const topics = await prisma.forumTopic.findMany({
    where: { status: { in: ["OPEN", "PINNED"] } },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    include: {
      author: { select: { name: true } },
      _count: { select: { comments: true } },
    },
    take: 50,
  });

  return (
    <main className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 sm:px-8">
        <div className="mb-12 space-y-4">
          <h1 className="text-5xl font-display font-bold tracking-tight">Comunidad</h1>
          <p className="text-slate-400">Foro de profesionales: técnicas, productos y tendencias de barra.</p>
        </div>

        <CreateTopicForm />

        {topics.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-white/10 bg-[#121212] p-8 text-slate-400">
            Aún no hay temas publicados. Sé el primero en abrir un debate.
          </p>
        ) : (
          <div className="mt-8">
          <ul className="space-y-4">
            {topics.map((topic) => (
              <li key={topic.id}>
                <Link
                  href={`/comunidad/${topic.slug}`}
                  className="block rounded-2xl border border-white/10 bg-[#121212] p-6 transition hover:border-electric-yellow/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      {topic.isPinned ? (
                        <span className="mb-2 inline-flex rounded-full bg-electric-yellow/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-electric-yellow">
                          Fijado
                        </span>
                      ) : null}
                      <h2 className="text-xl font-bold text-white">{topic.title}</h2>
                      <p className="mt-2 text-sm text-slate-500">
                        {topic.author.name ?? "Usuario"} · {topic._count.comments} comentarios ·{" "}
                        {topic.viewCount} vistas
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(topic.updatedAt).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          </div>
        )}
      </div>
    </main>
  );
}
