import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import BookCard from "@/components/biblioteca/BookCard";
import CocktailCard from "@/components/CocktailCard";
import { BrandLinkButton } from "@/components/ui/BrandButton";
import { MetaChip } from "@/components/ui/MetaChip";
import { getBookBySlug, getRelatedBooks } from "@/lib/books/catalog";
import { getRecipeBySlug } from "@/lib/recipes/catalog";
import { BOOK_COLLECTION_LABELS } from "@/types/book";
import type { AppLocale } from "@/i18n/routing";

export const revalidate = 86400;

type Props = { params: { slug: string; locale: AppLocale } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = getBookBySlug(params.slug, params.locale);
  if (!book) return { title: "Libro no encontrado" };
  return {
    title: `${book.title} | Biblioteca | El Travieso`,
    description: book.summary,
  };
}

export default async function BookPage({ params }: Props) {
  const book = getBookBySlug(params.slug, params.locale);
  if (!book) notFound();

  const relatedBooks = getRelatedBooks(book.slug, 3, params.locale);
  const linkedRecipes = (
    await Promise.all((book.cocktailSlugs ?? []).map((slug) => getRecipeBySlug(slug, params.locale)))
  ).filter(Boolean);

  return (
    <main className="min-h-screen bg-[#FAFAFA] pt-28 pb-24 text-slate-900">
      <div className="section-shell">
        <nav className="mb-10 flex items-center gap-2 text-sm">
          <Link href="/biblioteca" className="text-slate-400 transition-colors hover:text-electric-blue">
            Biblioteca
          </Link>
          <span className="text-slate-600">/</span>
          <span className="font-medium text-white">{book.title}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1fr_320px] lg:gap-16">
          <div className="space-y-10">
            <div className="space-y-5">
              <p className="eyebrow">{BOOK_COLLECTION_LABELS[book.collection]}</p>
              <h1 className="text-display">{book.title}</h1>
              {book.subtitle ? <p className="text-lg text-slate-400">{book.subtitle}</p> : null}
              <p className="text-lg text-electric-blue">{book.authors.join(", ")}</p>
              <p className="max-w-2xl text-body">{book.summary}</p>
            </div>

            {book.whyItMatters ? (
              <section className="space-y-4 rounded-card border border-white/10 bg-[var(--surface-panel)] p-6 sm:p-8">
                <h2 className="text-title">Por qué importa</h2>
                <p className="text-body leading-relaxed">{book.whyItMatters}</p>
              </section>
            ) : null}

            {linkedRecipes.length > 0 ? (
              <section className="space-y-6">
                <h2 className="text-title">Recetas en este libro</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  {linkedRecipes.map((recipe) =>
                    recipe ? (
                      <CocktailCard
                        key={recipe.slug}
                        title={recipe.title}
                        slug={recipe.slug}
                        rating={recipe.rating}
                        glass={recipe.glass}
                        ingredients={recipe.ingredients}
                        abv={recipe.abv}
                        kcal={recipe.kcal}
                        cover={recipe.cover}
                      />
                    ) : null,
                  )}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-card border border-white/10 bg-[var(--surface-panel)]">
              <div className="relative aspect-[3/4] bg-charcoal">
                <Image
                  src={book.cover}
                  alt={book.title}
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="rounded-card border border-white/10 bg-[var(--surface-panel)] p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {book.year ? <MetaChip tone="blue">{String(book.year)}</MetaChip> : null}
                {book.language ? <MetaChip>{book.language.toUpperCase()}</MetaChip> : null}
                {book.pages ? <MetaChip>{`${book.pages} págs.`}</MetaChip> : null}
                {book.rating ? <MetaChip tone="yellow">{`★ ${book.rating}`}</MetaChip> : null}
              </div>
              {book.publisher ? (
                <p className="text-sm text-slate-400">
                  <span className="text-slate-500">Editorial: </span>
                  {book.publisher}
                </p>
              ) : null}
              {book.isbn ? (
                <p className="text-sm text-slate-400">
                  <span className="text-slate-500">ISBN: </span>
                  {book.isbn}
                </p>
              ) : null}
              {book.tags && book.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {book.tags.map((tag) => (
                    <MetaChip key={tag} tone="blue">
                      {tag}
                    </MetaChip>
                  ))}
                </div>
              ) : null}

              {book.shopSlug ? (
                <BrandLinkButton href={`/shop/${book.shopSlug}`} className="w-full">
                  Comprar en tienda
                </BrandLinkButton>
              ) : book.affiliateUrl ? (
                <a
                  href={book.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-pill border border-white/15 bg-transparent px-6 py-3 text-sm font-medium text-white transition-colors hover:border-white/30 hover:bg-white/5"
                >
                  Ver en tienda externa
                </a>
              ) : null}
            </div>
          </aside>
        </div>

        {relatedBooks.length > 0 ? (
          <div className="mt-24 border-t border-white/10 pt-16">
            <h2 className="text-title mb-8">También te puede interesar</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedBooks.map((related) => (
                <BookCard key={related.id} book={related} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
