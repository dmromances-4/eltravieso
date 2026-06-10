import booksData from "@/data/books.json";
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

export function getAllBooks(): BookRecord[] {
  return [...books].sort((a, b) => a.title.localeCompare(b.title, "es"));
}

export function getBookBySlug(slug: string): BookRecord | null {
  return books.find((book) => book.slug === slug) ?? null;
}

export function getBooksByCollection(collection: BookCollection | null): BookRecord[] {
  const sorted = getAllBooks();
  if (!collection) return sorted;
  return sorted.filter((book) => book.collection === collection);
}

export function searchBooks(query: string): BookRecord[] {
  const normalizedQuery = normalizeText(query).trim();
  if (!normalizedQuery) return getAllBooks();

  return getAllBooks().filter((book) => {
    const haystack = normalizeText(
      [book.title, book.subtitle ?? "", book.authors.join(" "), book.summary, ...(book.tags ?? [])].join(" "),
    );
    return haystack.includes(normalizedQuery);
  });
}

export function filterBooks(options: {
  query?: string;
  collection?: BookCollection | null;
  letter?: string | null;
}): BookRecord[] {
  let result = options.query ? searchBooks(options.query) : getAllBooks();

  if (options.collection) {
    result = result.filter((book) => book.collection === options.collection);
  }

  if (options.letter) {
    result = result.filter((book) => firstLetter(book.title) === options.letter);
  }

  return result;
}

export function getRelatedBooks(slug: string, limit = 3): BookRecord[] {
  const current = getBookBySlug(slug);
  if (!current) return [];

  const tagSet = new Set(current.tags ?? []);
  return getAllBooks()
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

export function getBooksForCocktailSlug(cocktailSlug: string, limit = 6): BookRecord[] {
  return getAllBooks()
    .filter((book) => book.cocktailSlugs?.includes(cocktailSlug))
    .slice(0, limit);
}

export { firstLetter };
