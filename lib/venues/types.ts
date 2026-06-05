import type {
  ReservationProvider,
  VenueContinent,
  VenueListScope,
  Worlds50BestCategory,
} from "@prisma/client";

export type VenueSourceKind = "affiliate" | "editorial";

export type VenueRanking = {
  scope: VenueListScope;
  continent: VenueContinent;
  category: Worlds50BestCategory;
  rank: number;
  listUrl: string;
};

export type VenuePublicDTO = {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string | null;
  address: string | null;
  venueType: string;
  photoUrl: string | null;
  history: string | null;
  verdict: string | null;
  foundationYear: number | null;
  signatureDrink: string | null;
  dressCode: string | null;
  vibeTags: string[];
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  source: VenueSourceKind;
  worlds50bestRank: number | null;
  worlds50bestCategory: Worlds50BestCategory | null;
  continent: VenueContinent | null;
  regionalRank: number | null;
  additionalRankings: VenueRanking[];
  sourceUrl: string | null;
  externalWebsite: string | null;
  tripadvisorUrl: string | null;
  tripadvisorRating: number | null;
  chefName: string | null;
  reservationProvider: ReservationProvider | null;
  reservationUrl: string | null;
  coverManagerUrl: string | null;
  theForkUrl: string | null;
  isPremium: boolean;
  mapPlan: "FREE" | "FEATURED" | "BOOKING_PLUS";
  bookingWidgetEnabled: boolean;
};

export type MapVenueDTO = {
  id: string;
  slug: string;
  name: string;
  venueType: string;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string;
  photoUrl: string | null;
  profileUrl: string;
  layer: "affiliate" | "editorial";
  worlds50bestRank: number | null;
  continent: VenueContinent | null;
  regionalRank: number | null;
  isPremium?: boolean;
};

export type NormalizedVenueGuide = {
  slug: string;
  name: string;
  city: string;
  country?: string | null;
  address?: string | null;
  venueType: string;
  photoUrl?: string | null;
  history?: string | null;
  verdict?: string | null;
  chefName?: string | null;
  worlds50bestRank: number;
  worlds50bestCategory: Worlds50BestCategory;
  continent?: VenueContinent;
  listScope?: VenueListScope;
  regionalRank?: number | null;
  additionalRankings?: VenueRanking[];
  listUrl?: string;
  sourceUrl: string;
  externalWebsite?: string | null;
  tripadvisorUrl?: string | null;
  tripadvisorRating?: number | null;
  enrichmentSource?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function parseAdditionalRankings(value: unknown): VenueRanking[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (r): r is VenueRanking =>
      r != null &&
      typeof r === "object" &&
      "scope" in r &&
      "continent" in r &&
      "category" in r &&
      "rank" in r &&
      "listUrl" in r,
  );
}
