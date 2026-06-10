import type { Metadata } from "next";
import RecetasClient from "@/components/recetas/RecetasClient";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { getCatalogRecipes } from "@/lib/recipes/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cocteles | El Travieso Vermut",
  description: "Descubre nuestras recetas de cocteles con vermut y fórmulas de autor listas para probar.",
};

export default async function CocktailsPage() {
  const cocktails = await getCatalogRecipes();

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <section className="pt-24 pb-8">
        <div className="section-shell">
          <PageHero
            eyebrow="Recetario"
            title="Recetas de cocteles con carácter"
            lead="Explora la colección oficial y las recetas creadas con la Barra IA. Cada ficha incluye ingredientes, preparación y notas para montar la barra como un profesional."
          />
        </div>
      </section>
      <Section compact>
        <RecetasClient recipes={cocktails} />
      </Section>
    </main>
  );
}
