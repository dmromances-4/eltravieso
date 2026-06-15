export type RecipeReviewStatus = "pending" | "ok" | "fixed" | "manual";

export interface CocktailRecord {
  id: string;
  diffordsId?: number;
  sourceUrl?: string;
  title: string;
  slug: string;
  rating: number;
  glass: string;
  ingredients: string[];
  method: string;
  abv: string;
  kcal: number;
  cover: string;
  coverAttribution?: string;
  reviewStatus?: RecipeReviewStatus;
  reviewedAt?: string;
  reviewNotes?: string;
}
