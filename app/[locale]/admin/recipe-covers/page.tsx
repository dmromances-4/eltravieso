import { loadCocktails } from "@/lib/recipes/cocktails-io";
import { readCoverManifest } from "@/lib/recipes/cover-manifest";
import { shouldRegenerateCover } from "@/lib/recipes/cover-utils";
import RecipeCoversPanel from "@/components/admin/RecipeCoversPanel";

export const dynamic = "force-dynamic";

export default async function AdminRecipeCoversPage() {
  const recipes = loadCocktails().filter((r) => shouldRegenerateCover(r.cover));
  const preview = recipes.slice(0, 30);

  const rows = await Promise.all(
    preview.map(async (recipe) => {
      const manifest = await readCoverManifest(recipe.slug);
      const candidates =
        manifest?.candidates
          ?.filter((c) => c.license === "free_stock")
          .slice(0, 3)
          .map((c) => ({
            source: c.source,
            score: c.score ?? 0,
            url: c.url,
            attribution: c.attribution,
          })) ?? [];
      return {
        slug: recipe.slug,
        title: recipe.title,
        cover: recipe.cover,
        candidates,
      };
    }),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold tracking-tight text-white">Portadas de recetas</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Recetas sin foto real ({recipes.length} pendientes). Previsualiza candidatos del manifest y aplica stock
          Pexels/Unsplash. Genera manifests con{" "}
          <code className="text-electric-blue">npm run generate:recipe-images -- --discover-only --limit 30</code>.
        </p>
      </div>
      <RecipeCoversPanel rows={rows} />
    </div>
  );
}
