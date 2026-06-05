import Link from "next/link";
import RecipeEditForm from "@/components/admin/RecipeEditForm";

export default function AdminNewRecipePage() {
  return (
    <div className="space-y-8">
      <Link
        href="/admin/recipes"
        className="inline-flex text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-electric-yellow"
      >
        ← Volver a recetas
      </Link>
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Nueva receta</h1>
        <p className="mt-2 text-slate-400">Crea una ficha manual o usa el generador IA.</p>
      </div>
      <RecipeEditForm />
    </div>
  );
}
