export type BookCollection = "clasico" | "tecnica" | "editorial" | "historia" | "vermut";

export interface BookRecord {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  authors: string[];
  year?: number;
  publisher?: string;
  language?: string;
  pages?: number;
  isbn?: string;
  collection: BookCollection;
  cover: string;
  summary: string;
  whyItMatters?: string;
  cocktailSlugs?: string[];
  tags?: string[];
  shopSlug?: string;
  affiliateUrl?: string;
  rating?: number;
}

export const BOOK_COLLECTION_LABELS: Record<BookCollection, string> = {
  clasico: "Clásico",
  tecnica: "Técnica",
  editorial: "Editorial",
  historia: "Historia",
  vermut: "Vermut",
};
