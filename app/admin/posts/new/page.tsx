import Link from "next/link";
import PostEditor from "@/components/blog/PostEditor";

export default function AdminNewPostPage() {
  return (
    <div className="space-y-8">
      <Link
        href="/admin/posts"
        className="inline-flex text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-electric-yellow"
      >
        ← Volver al blog
      </Link>
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Nuevo artículo</h1>
        <p className="mt-2 text-slate-400">Publica contenido en el blog de El Travieso.</p>
      </div>
      <PostEditor allowPremiumToggle redirectPath="/admin/posts" />
    </div>
  );
}
