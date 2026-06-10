import { describe, expect, it } from "vitest";
import {
  filterBooks,
  firstLetter,
  getAllBooks,
  getBookBySlug,
  getBooksByCollection,
  getBooksForCocktailSlug,
  getRelatedBooks,
  searchBooks,
} from "@/lib/books/catalog";

describe("books catalog", () => {
  it("has unique slugs and ids", () => {
    const books = getAllBooks();
    expect(books.length).toBeGreaterThanOrEqual(12);

    const slugs = books.map((book) => book.slug);
    const ids = books.map((book) => book.id);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns books sorted by title", () => {
    const titles = getAllBooks().map((book) => book.title);
    const sorted = [...titles].sort((a, b) => a.localeCompare(b, "es"));
    expect(titles).toEqual(sorted);
  });

  it("finds books by slug", () => {
    const book = getBookBySlug("the-savoy-cocktail-book");
    expect(book?.title).toBe("The Savoy Cocktail Book");
    expect(getBookBySlug("no-existe")).toBeNull();
  });

  it("filters by collection", () => {
    const classic = getBooksByCollection("clasico");
    expect(classic.length).toBeGreaterThan(0);
    expect(classic.every((book) => book.collection === "clasico")).toBe(true);
  });

  it("searches by title, author and tags", () => {
    expect(searchBooks("savoy").some((book) => book.slug === "the-savoy-cocktail-book")).toBe(true);
    expect(searchBooks("simon difford").length).toBeGreaterThan(0);
    expect(searchBooks("vermut").length).toBeGreaterThan(0);
    expect(searchBooks("xyz-no-match")).toHaveLength(0);
  });

  it("filters by query, collection and letter", () => {
    const filtered = filterBooks({ query: "cocktail", collection: "tecnica", letter: "C" });
    expect(filtered.every((book) => book.collection === "tecnica")).toBe(true);
    expect(filtered.every((book) => firstLetter(book.title) === "C")).toBe(true);
  });

  it("links books to cocktail slugs", () => {
    const books = getBooksForCocktailSlug("sweet-martini");
    expect(books.some((book) => book.slug === "the-savoy-cocktail-book")).toBe(true);
    expect(getBooksForCocktailSlug("slug-inexistente")).toHaveLength(0);
  });

  it("returns related books from same collection or shared tags", () => {
    const related = getRelatedBooks("the-savoy-cocktail-book", 3);
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((book) => book.slug !== "the-savoy-cocktail-book")).toBe(true);
  });
});
