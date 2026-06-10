import type { Metadata } from "next";
import BibliotecaClient from "@/components/biblioteca/BibliotecaClient";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { getAllBooks } from "@/lib/books/catalog";

export const metadata: Metadata = {
  title: "Biblioteca | El Travieso Vermut",
  description: "Libros de referencia para la barra: clásicos, técnica, editoriales e historia del vermut y la coctelería.",
};

export default function BibliotecaPage() {
  const books = getAllBooks();

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <section className="pt-24 pb-8">
        <div className="section-shell">
          <PageHero
            eyebrow="Biblioteca"
            title="Libros de referencia para la barra"
            lead="Clásicos imprescindibles, manuales de técnica, editoriales de autor e historia del vermut — curados para complementar nuestro recetario."
          />
        </div>
      </section>
      <Section compact>
        <BibliotecaClient books={books} />
      </Section>
    </main>
  );
}
