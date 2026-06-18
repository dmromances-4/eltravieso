import { Link } from "@/i18n/navigation";
import prisma from "@/lib/prisma";
import AdminRecipesList from "@/components/admin/AdminRecipesList";

export const dynamic = "force-dynamic";

export default async function AdminRecipesPage() {
  const recipes = await prisma.recipe.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { email: true, name: true } },
    },
  });

  const mapped = recipes.map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    slug: recipe.slug,
    isPublished: recipe.isPublished,
    updatedAt: recipe.updatedAt.toISOString(),
    author: recipe.author,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-white">Recetas</h1>
          <p className="mt-2 text-slate-400">Gestiona el catálogo de cócteles en base de datos.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/pro/tech-generator"
            className="rounded-full border border-white/20 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:border-electric-yellow"
          >
            Generar con IA
          </Link>
          <Link
            href="/admin/recipes/new"
            className="rounded-full bg-electric-red px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:brightness-110"
          >
            Nueva receta
          </Link>
        </div>
      </div>

      <AdminRecipesList recipes={mapped} />
    </div>
  );
}
