import booksData from "@/data/books.json";
import type { AppLocale } from "@/i18n/routing";
import { getLocalizedCollection, mergeLocalizedFields } from "@/lib/i18n/content";
import type { BookCollection, BookRecord } from "@/types/book";

const books = booksData as BookRecord[];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function firstLetter(title: string): string {
  const char = normalizeText(title).trim().charAt(0);
  if (char >= "a" && char <= "z") return char.toUpperCase();
  return "#";
}

export function getAllBooks(locale: AppLocale = "es"): BookRecord[] {
  return getLocalizedCollection(books, locale, "books").sort((a, b) =>
    a.title.localeCompare(b.title, "es"),
  );
}

export function getBookBySlug(slug: string, locale: AppLocale = "es"): BookRecord | null {
  const book = books.find((item) => item.slug === slug);
  if (!book) return null;
  return mergeLocalizedFields(book, locale, "books");
}

export function getBooksByCollection(
  collection: BookCollection | null,
  locale: AppLocale = "es",
): BookRecord[] {
  const sorted = getAllBooks(locale);
  if (!collection) return sorted;
  return sorted.filter((book) => book.collection === collection);
}

export function searchBooks(query: string, locale: AppLocale = "es"): BookRecord[] {
  const normalizedQuery = normalizeText(query).trim();
  if (!normalizedQuery) return getAllBooks(locale);

  return getAllBooks(locale).filter((book) => {
    const haystack = normalizeText(
      [book.title, book.subtitle ?? "", book.authors.join(" "), book.summary, ...(book.tags ?? [])].join(" "),
    );
    return haystack.includes(normalizedQuery);
  });
}

export function filterBooks(
  options: {
    query?: string;
    collection?: BookCollection | null;
    letter?: string | null;
  },
  locale: AppLocale = "es",
): BookRecord[] {
  let result = options.query ? searchBooks(options.query, locale) : getAllBooks(locale);

  if (options.collection) {
    result = result.filter((book) => book.collection === options.collection);
  }

  if (options.letter) {
    result = result.filter((book) => firstLetter(book.title) === options.letter);
  }

  return result;
}

export function getRelatedBooks(slug: string, limit = 3, locale: AppLocale = "es"): BookRecord[] {
  const current = getBookBySlug(slug, locale);
  if (!current) return [];

  const tagSet = new Set(current.tags ?? []);
  return getAllBooks(locale)
    .filter((book) => book.slug !== slug)
    .map((book) => {
      let score = 0;
      if (book.collection === current.collection) score += 2;
      for (const tag of book.tags ?? []) {
        if (tagSet.has(tag)) score += 1;
      }
      return { book, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.book.title.localeCompare(b.book.title, "es"))
    .slice(0, limit)
    .map(({ book }) => book);
}

export function getBooksForCocktailSlug(
  cocktailSlug: string,
  limit = 6,
  locale: AppLocale = "es",
): BookRecord[] {
  return getAllBooks(locale)
    .filter((book) => book.cocktailSlugs?.includes(cocktailSlug))
    .slice(0, limit);
}

export { firstLetter };
