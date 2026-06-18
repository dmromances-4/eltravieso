import { Link } from "@/i18n/navigation";
import PostEditor from "@/components/blog/PostEditor";

export default function NuevoBlogPostPage() {
  return (
    <div className="space-y-8">
      <Link
        href="/cuenta/blog"
        className="inline-flex text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-electric-yellow"
      >
        ← Volver a mis artículos
      </Link>
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Crear post</h1>
        <p className="mt-2 text-slate-400">Publica un artículo en el blog de El Travieso.</p>
      </div>
      <PostEditor />
    </div>
  );
}
