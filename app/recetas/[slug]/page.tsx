import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import IngredientTechSheet from "@/components/IngredientTechSheet";
import RecipeCoverImage from "@/components/RecipeCoverImage";
import RecipeVideo from "@/components/RecipeVideo";
import RecipeCommerceBlock from "@/components/recipes/RecipeCommerceBlock";
import RecipePremiumGate from "@/components/recipes/RecipePremiumGate";
import { getRecipeBySlug, getRelatedRecipes } from "@/lib/recipes/catalog";
import { matchProductsForRecipe } from "@/lib/recipes/match-products";

export const revalidate = 86400;

const normalizeIngredients = (value: string[]) =>
  value
    .flatMap((item) => item.split(/\r?\n|;|\s*-\s*/))
    .map((item) => item.trim())
    .filter(Boolean);

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const cocktail = await getRecipeBySlug(params.slug);
  if (!cocktail) return { title: "Cocktail no encontrado" };
  return {
    title: `${cocktail.title} | El Travieso Vermut`,
    description: `Receta de ${cocktail.title} - ${cocktail.kcal} kcal, ${cocktail.abv} ABV`,
  };
}

const premiumLockedFallback = (
  <div className="space-y-4 rounded-[2rem] border border-electric-red/30 bg-electric-red/10 p-8 backdrop-blur-xl">
    <h2 className="text-2xl font-display font-bold text-white">Ficha técnica premium</h2>
    <p className="text-slate-300">
      Esta receta incluye detalle de destilados raros y técnicas avanzadas. Únete al Club de la Trastienda para
      desbloquearla.
    </p>
    <Link
      href="/cuenta/membresia"
      className="inline-flex items-center justify-center rounded-full bg-electric-red px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white"
    >
      Ver membresía VIP
    </Link>
  </div>
);

export default async function CocktailPage({ params }: { params: { slug: string } }) {
  const cocktail = await getRecipeBySlug(params.slug);
  if (!cocktail) {
    notFound();
  }

  const ingredientList = normalizeIngredients(cocktail.ingredients);
  const productMatches = await matchProductsForRecipe(ingredientList, {
    glass: cocktail.glass,
    method: cocktail.method,
  });

  const relatedRecipes = await getRelatedRecipes(params.slug, 3);
  const steps = cocktail.method.split("\n").filter(Boolean);
  const hasCommerce =
    productMatches.ingredientMatches.length > 0 || productMatches.affiliateGear.length > 0;

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 text-white">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <nav className="mb-12 flex items-center gap-2 text-sm">
          <Link href="/recetas" className="text-slate-400 hover:text-electric-yellow transition-colors">
            Recetario
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-electric-yellow font-semibold">{cocktail.title}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              <RecipeCoverImage title={cocktail.title} cover={cocktail.cover} />
              <div className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-6 shadow-neon backdrop-blur-xl">
                <div className="grid gap-4">
                  <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Potencia</p>
                    <p className="text-2xl font-bold text-electric-yellow">{cocktail.abv}</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Calorías</p>
                    <p className="text-2xl font-bold text-white">{cocktail.kcal} kcal</p>
                  </div>
                  <div className="rounded-lg bg-electric-yellow/10 p-4 border border-electric-yellow/20">
                    <p className="text-xs text-slate-300 uppercase tracking-widest mb-1">Rating</p>
                    <p className="text-2xl font-bold text-electric-yellow">★ {cocktail.rating.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-12">
            <div className="space-y-6">
              <p className="inline-flex rounded-full border border-electric-yellow/20 bg-electric-yellow/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-electric-yellow">
                {cocktail.source === "database" ? "Receta Barra IA" : "Receta Vermut"}
              </p>
              <h1 className="text-5xl font-display font-bold tracking-tight text-white sm:text-6xl">{cocktail.title}</h1>
              <p className="text-xl text-slate-400">{cocktail.glass}</p>
              {cocktail.summary ? <p className="text-base leading-7 text-slate-300">{cocktail.summary}</p> : null}
              {cocktail.isPremium ? (
                <p className="inline-flex rounded-full border border-electric-red/40 bg-electric-red/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-electric-red">
                  Contenido Club VIP
                </p>
              ) : null}
            </div>

            <RecipePremiumGate isPremium={Boolean(cocktail.isPremium)} lockedFallback={premiumLockedFallback}>
              <section className="space-y-6">
                <IngredientTechSheet ingredients={ingredientList} />
              </section>

              <RecipeVideo url={cocktail.videoUrl} />

              <section className="space-y-6">
                <h2 className="text-3xl font-display font-bold text-white">Preparación</h2>
                <div className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-8 backdrop-blur-xl space-y-4">
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-electric-blue/20 text-electric-blue text-sm font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-base text-slate-300 leading-relaxed">{step.trim()}</p>
                    </div>
                  ))}
                </div>
              </section>

              <RecipeCommerceBlock matches={productMatches} ingredients={ingredientList} />
            </RecipePremiumGate>

            {!hasCommerce && (
              <div className="rounded-[2rem] border border-electric-yellow/20 bg-electric-yellow/5 p-8 backdrop-blur-xl">
                <h3 className="text-xl font-display font-bold text-white mb-4">¿Quieres prepararlo?</h3>
                <p className="text-slate-300 mb-6">
                  Consigue todos los ingredientes premium en nuestra tienda official. Vermut, botellas y accesorios para
                  montar la barra perfecta.
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-full bg-electric-yellow px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-black transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,204,0,0.3)]"
                >
                  Ir a la Tienda
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-24 border-t border-white/10 pt-16">
          <h2 className="text-3xl font-display font-bold text-white mb-8">Otras Recetas</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedRecipes.map((related) => (
              <Link
                key={`${related.source}-${related.slug}`}
                href={`/recetas/${related.slug}`}
                className="group rounded-[1.5rem] border border-white/10 bg-[#111111]/90 p-6 transition-all hover:-translate-y-1 hover:border-electric-yellow/30 hover:shadow-[0_0_40px_rgba(255,204,0,0.1)]"
              >
                <div className="mb-4 flex h-16 items-center justify-center rounded-lg bg-white/5">
                  <span className="text-3xl">🍸</span>
                </div>
                <h3 className="font-display font-bold text-white group-hover:text-electric-yellow transition-colors">
                  {related.title}
                </h3>
                <p className="mt-2 text-xs text-slate-400">
                  {related.kcal} kcal • {related.abv} ABV
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
