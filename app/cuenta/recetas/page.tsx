import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import { parseStoredIngredients } from "@/lib/recipes/parse";
import RecipeVideoEditor from "@/components/account/RecipeVideoEditor";
import RegenerateRecipeImageButton from "@/components/account/RegenerateRecipeImageButton";

export const dynamic = 'force-dynamic';

export default async function AccountRecipesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const recipes = await prisma.recipe.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Mis recetas</h1>
          <p className="mt-2 text-slate-400">Recetas que has creado con el agente de Barra IA.</p>
        </div>
        <Link
          href="/pro/tech-generator?tab=agent"
          className="inline-flex justify-center rounded-full bg-electric-yellow px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black hover:brightness-110"
        >
          Crear receta
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-white/20 bg-[#111111]/50 p-12 text-center">
          <p className="text-slate-400">Aún no tienes recetas guardadas.</p>
          <Link href="/pro/tech-generator?tab=agent" className="mt-4 inline-flex text-sm font-semibold text-electric-yellow">
            Crear tu primera receta →
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {recipes.map((recipe) => {
            const ingredients = parseStoredIngredients(recipe.ingredients);
            return (
              <li
                key={recipe.id}
                className="rounded-[1.5rem] border border-white/10 bg-[#111111]/90 p-6 transition hover:border-electric-yellow/30"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">{recipe.title}</h2>
                    {recipe.summary ? <p className="mt-2 text-sm text-slate-400 line-clamp-2">{recipe.summary}</p> : null}
                    {ingredients.length > 0 ? (
                      <p className="mt-3 text-xs text-slate-500 line-clamp-1">{ingredients.join(" · ")}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-600">
                      {new Date(recipe.createdAt).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Link
                    href={`/recetas/${recipe.slug}`}
                    className="shrink-0 rounded-full border border-electric-yellow/30 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-electric-yellow hover:bg-electric-yellow/10"
                  >
                    Ver ficha
                  </Link>
                </div>
                <RecipeVideoEditor recipeId={recipe.id} initialUrl={recipe.videoUrl} />
                <RegenerateRecipeImageButton recipeId={recipe.id} slug={recipe.slug} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
