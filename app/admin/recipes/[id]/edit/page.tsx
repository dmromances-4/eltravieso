import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import RecipeEditForm from "@/components/admin/RecipeEditForm";

export const dynamic = "force-dynamic";

export default async function AdminEditRecipePage({ params }: { params: { id: string } }) {
  const recipe = await prisma.recipe.findUnique({ where: { id: params.id } });
  if (!recipe) notFound();

  return (
    <div className="space-y-8">
      <Link
        href="/admin/recipes"
        className="inline-flex text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-electric-yellow"
      >
        ← Volver a recetas
      </Link>
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Editar receta</h1>
        <p className="mt-2 text-slate-400">{recipe.title}</p>
      </div>
      <RecipeEditForm recipe={recipe} />
    </div>
  );
}
