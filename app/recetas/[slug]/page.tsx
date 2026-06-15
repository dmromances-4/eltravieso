import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import IngredientTechSheet from "@/components/IngredientTechSheet";
import RecipeCoverImage from "@/components/RecipeCoverImage";
import RecipeVideo from "@/components/RecipeVideo";
import RecipeCommerceBlock from "@/components/recipes/RecipeCommerceBlock";
import RecipePremiumGate from "@/components/recipes/RecipePremiumGate";
import CocktailCard from "@/components/CocktailCard";
import { BrandLinkButton } from "@/components/ui/BrandButton";
import { MetaChip } from "@/components/ui/MetaChip";
import { getRecipeBySlug, getRelatedRecipes } from "@/lib/recipes/catalog";
import { matchProductsForRecipe } from "@/lib/recipes/match-products";
import { listMediaForCocktailSlug } from "@/lib/media/catalog";
import { getBooksForCocktailSlug } from "@/lib/books/catalog";
import BookCard from "@/components/biblioteca/BookCard";

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
  <div className="space-y-4 rounded-card border border-electric-red/30 bg-electric-red/10 p-8">
    <h2 className="text-title text-white">Ficha técnica premium</h2>
    <p className="text-body">
      Esta receta incluye detalle de destilados raros y técnicas avanzadas. Únete al Club de la Trastienda para
      desbloquearla.
    </p>
    <BrandLinkButton href="/cuenta/membresia" variant="danger">
      Ver membresía VIP
    </BrandLinkButton>
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
  const pantallaLinks = await listMediaForCocktailSlug(params.slug, 6);
  const bibliotecaLinks = getBooksForCocktailSlug(params.slug, 6);
  const steps = cocktail.method.split("\n").filter(Boolean);
  const hasCommerce =
    productMatches.ingredientMatches.length > 0 || productMatches.affiliateGear.length > 0;

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-28 pb-24 text-white">
      <div className="section-shell">
        <nav className="mb-10 flex items-center gap-2 text-sm">
          <Link href="/recetas" className="text-slate-400 transition-colors hover:text-electric-blue">
            Recetario
          </Link>
          <span className="text-slate-600">/</span>
          <span className="font-medium text-white">{cocktail.title}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1fr_320px] lg:gap-16">
          <div className="space-y-10">
            <div className="space-y-5">
              <p className="eyebrow">
                {cocktail.source === "database" ? "Receta Barra IA" : "Receta Vermut"}
              </p>
              <h1 className="text-display">{cocktail.title}</h1>
              <p className="text-lg text-electric-blue">{cocktail.glass}</p>
              {cocktail.summary ? <p className="max-w-2xl text-body">{cocktail.summary}</p> : null}
              {cocktail.isPremium ? (
                <MetaChip tone="red">Contenido Club VIP</MetaChip>
              ) : null}
            </div>

            <div className="max-w-xl lg:hidden">
              <RecipeCoverImage
                title={cocktail.title}
                cover={cocktail.cover}
                attribution={cocktail.coverAttribution}
              />
            </div>

            <RecipePremiumGate isPremium={Boolean(cocktail.isPremium)} lockedFallback={premiumLockedFallback}>
              <RecipeVideo url={cocktail.videoUrl} />

              <section className="space-y-6">
                <h2 className="text-title">Preparación</h2>
                <div className="space-y-4 rounded-card border border-white/10 bg-[var(--surface-panel)] p-6 sm:p-8">
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-electric-blue/15 text-sm font-semibold text-electric-blue">
                        {idx + 1}
                      </span>
                      <p className="text-base leading-relaxed text-slate-300">{step.trim()}</p>
                    </div>
                  ))}
                </div>
              </section>

              <RecipeCommerceBlock matches={productMatches} ingredients={ingredientList} />
            </RecipePremiumGate>

            {!hasCommerce ? (
              <div className="rounded-card border border-white/10 bg-[var(--surface-panel)] p-8">
                <h3 className="text-title mb-3">¿Quieres prepararlo?</h3>
                <p className="mb-6 text-body">
                  Consigue todos los ingredientes premium en nuestra tienda oficial. Vermut, botellas y accesorios para
                  montar la barra perfecta.
                </p>
                <BrandLinkButton href="/shop">Ir a la tienda</BrandLinkButton>
              </div>
            ) : null}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="hidden lg:block">
              <RecipeCoverImage
                title={cocktail.title}
                cover={cocktail.cover}
                attribution={cocktail.coverAttribution}
              />
            </div>

            <div className="rounded-card border border-white/10 bg-[var(--surface-panel)] p-6">
              <div className="mb-6 flex flex-wrap gap-2">
                {cocktail.abv !== "—" ? <MetaChip>{`${cocktail.abv} ABV`}</MetaChip> : null}
                <MetaChip>{`${cocktail.kcal} kcal`}</MetaChip>
                <MetaChip tone="yellow">{`★ ${cocktail.rating.toFixed(1)}`}</MetaChip>
              </div>

              <RecipePremiumGate
                isPremium={Boolean(cocktail.isPremium)}
                lockedFallback={
                  <p className="text-sm text-slate-400">Desbloquea la membresía VIP para ver ingredientes.</p>
                }
              >
                <h2 className="mb-4 text-lg font-semibold text-white">Ingredientes</h2>
                <IngredientTechSheet ingredients={ingredientList} />
              </RecipePremiumGate>
            </div>
          </aside>
        </div>

        {bibliotecaLinks.length > 0 ? (
          <div className="mt-24 border-t border-white/10 pt-16">
            <h2 className="text-title mb-8">También en Biblioteca</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bibliotecaLinks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        ) : null}

        {pantallaLinks.length > 0 ? (
          <div className="mt-24 border-t border-white/10 pt-16">
            <h2 className="text-title mb-8">También en Pantalla</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pantallaLinks.map((item) => (
                <Link
                  key={item.id}
                  href={`/pantalla/${item.slug}`}
                  className="rounded-card border border-white/10 bg-[var(--surface-panel)] p-5 transition-colors hover:border-electric-blue/30"
                >
                  <p className="text-caption text-slate-500">{item.kind}</p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-white">{item.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-24 border-t border-white/10 pt-16">
          <h2 className="text-title mb-8">Otras recetas</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedRecipes.map((related) => (
              <CocktailCard
                key={`${related.source}-${related.slug}`}
                title={related.title}
                slug={related.slug}
                rating={related.rating}
                glass={related.glass}
                ingredients={related.ingredients}
                abv={related.abv}
                kcal={related.kcal}
                cover={related.cover}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
