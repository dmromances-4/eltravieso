import Link from "next/link";

export default function AdminRecipesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Recipes</h2>
        <Link href="/admin/recipes/new" className="bg-red-600 text-white px-4 py-2 rounded">New Recipe</Link>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded p-4">
        <p className="text-zinc-400">No recipes listed yet — this page will show recipe management tools.</p>
      </div>
    </div>
  );
}
