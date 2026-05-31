import type { Metadata } from "next";
import CocktailCard from "@/components/CocktailCard";
import { getCatalogRecipes } from "@/lib/recipes/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cocteles | El Travieso Vermut",
  description: "Descubre nuestras recetas de cocteles con vermut y fórmulas de autor listas para probar.",
};

export default async function CocktailsPage() {
  const cocktails = await getCatalogRecipes();

  return (
    <main className="min-h-screen bg-night px-6 py-16 text-white sm:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <section className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-10 shadow-neon">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex rounded-full border border-electric-yellow/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-electric-yellow">
              Recetario Vermut
            </span>
            <h1 className="text-4xl font-display tracking-tight text-white sm:text-5xl">Recetas de cocteles con carácter</h1>
            <p className="text-base leading-7 text-slate-300">
              Explora la colección oficial y las recetas creadas con la Barra IA. Cada ficha incluye ingredientes,
              preparación y notas para montar la barra como un profesional.
            </p>
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {cocktails.map((cocktail) => (
            <CocktailCard key={`${cocktail.source}-${cocktail.slug}`} {...cocktail} />
          ))}
        </section>
      </div>
    </main>
  );
}
