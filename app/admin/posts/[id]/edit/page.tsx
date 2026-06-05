import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import PostEditor from "@/components/blog/PostEditor";

export const dynamic = "force-dynamic";

export default async function AdminEditPostPage({ params }: { params: { id: string } }) {
  const post = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!post) notFound();

  return (
    <div className="space-y-8">
      <Link
        href="/admin/posts"
        className="inline-flex text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-electric-yellow"
      >
        ← Volver al blog
      </Link>
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Editar artículo</h1>
        <p className="mt-2 text-slate-400">{post.title}</p>
      </div>
      <PostEditor
        postId={post.id}
        initialTitle={post.title}
        initialContent={post.content}
        initialCoverUrl={post.coverUrl}
        initialIsPremium={post.isPremium}
        allowPremiumToggle
        redirectPath="/admin/posts"
      />
    </div>
  );
}
