import prisma from "@/lib/prisma";
import ForumModerationList from "@/components/admin/ForumModerationList";

export const dynamic = "force-dynamic";

export default async function AdminForumPage() {
  const topics = await prisma.forumTopic.findMany({
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    include: {
      author: { select: { name: true } },
      _count: { select: { comments: true } },
    },
    take: 100,
  });

  const rows = topics.map((topic) => ({
    id: topic.id,
    title: topic.title,
    slug: topic.slug,
    status: topic.status,
    isPinned: topic.isPinned,
    authorName: topic.author.name,
    commentCount: topic._count.comments,
    updatedAt: topic.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold tracking-tight text-white">Foro — moderación</h1>
        <p className="mt-2 text-slate-400">Fijar, cerrar o archivar temas de la comunidad.</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-slate-400">No hay temas en el foro.</p>
      ) : (
        <ForumModerationList topics={rows} />
      )}
    </div>
  );
}
