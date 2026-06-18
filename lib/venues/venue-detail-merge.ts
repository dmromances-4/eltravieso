import type { BarProfile, VenueGuideEntry } from "@prisma/client";

type VenueDetailSlice = Pick<
  BarProfile,
  | "establishmentTypes"
  | "cuisineTypes"
  | "starDishes"
  | "idealFor"
  | "venueFeatures"
  | "neighborhood"
  | "priceRange"
  | "dailyMenuEnabled"
  | "dailyMenuNote"
  | "awards"
  | "venuePreferences"
  | "instagramUrl"
  | "tiktokUrl"
  | "tripadvisorUrl"
>;

type GuideDetailSlice = Pick<
  VenueGuideEntry,
  | "establishmentTypes"
  | "cuisineTypes"
  | "starDishes"
  | "idealFor"
  | "venueFeatures"
  | "neighborhood"
  | "priceRange"
  | "dailyMenuEnabled"
  | "dailyMenuNote"
  | "awards"
  | "venuePreferences"
  | "instagramUrl"
  | "tiktokUrl"
  | "tripadvisorUrl"
>;

export type VenueDetailDTO = {
  establishmentTypes: string[];
  cuisineTypes: string[];
  starDishes: string[];
  idealFor: string[];
  venueFeatures: string[];
  neighborhood: string | null;
  priceRange: string | null;
  dailyMenuEnabled: boolean;
  dailyMenuNote: string | null;
  awards: string[];
  venuePreferences: string[];
  instagramUrl: string | null;
  tiktokUrl: string | null;
  tripadvisorUrl: string | null;
};

const EMPTY_DETAIL: VenueDetailDTO = {
  establishmentTypes: [],
  cuisineTypes: [],
  starDishes: [],
  idealFor: [],
  venueFeatures: [],
  neighborhood: null,
  priceRange: null,
  dailyMenuEnabled: false,
  dailyMenuNote: null,
  awards: [],
  venuePreferences: [],
  instagramUrl: null,
  tiktokUrl: null,
  tripadvisorUrl: null,
};

function fromSlice(slice: Partial<VenueDetailSlice> | Partial<GuideDetailSlice>): VenueDetailDTO {
  return {
    establishmentTypes: slice.establishmentTypes ?? [],
    cuisineTypes: slice.cuisineTypes ?? [],
    starDishes: slice.starDishes ?? [],
    idealFor: slice.idealFor ?? [],
    venueFeatures: slice.venueFeatures ?? [],
    neighborhood: slice.neighborhood ?? null,
    priceRange: slice.priceRange ?? null,
    dailyMenuEnabled: slice.dailyMenuEnabled ?? false,
    dailyMenuNote: slice.dailyMenuNote ?? null,
    awards: slice.awards ?? [],
    venuePreferences: slice.venuePreferences ?? [],
    instagramUrl: slice.instagramUrl ?? null,
    tiktokUrl: slice.tiktokUrl ?? null,
    tripadvisorUrl: slice.tripadvisorUrl ?? null,
  };
}

/** Bar profile gana sobre guía editorial en campos enriquecidos. */
export function mergeVenueDetailFields(
  bar?: Partial<VenueDetailSlice> | null,
  guide?: Partial<GuideDetailSlice> | null,
): VenueDetailDTO {
  const base = fromSlice(guide ?? {});
  if (!bar) return base;

  const barDetail = fromSlice(bar);
  return {
    establishmentTypes: barDetail.establishmentTypes.length
      ? barDetail.establishmentTypes
      : base.establishmentTypes,
    cuisineTypes: barDetail.cuisineTypes.length ? barDetail.cuisineTypes : base.cuisineTypes,
    starDishes: barDetail.starDishes.length ? barDetail.starDishes : base.starDishes,
    idealFor: barDetail.idealFor.length ? barDetail.idealFor : base.idealFor,
    venueFeatures: barDetail.venueFeatures.length ? barDetail.venueFeatures : base.venueFeatures,
    neighborhood: barDetail.neighborhood ?? base.neighborhood,
    priceRange: barDetail.priceRange ?? base.priceRange,
    dailyMenuEnabled: barDetail.dailyMenuEnabled || base.dailyMenuEnabled,
    dailyMenuNote: barDetail.dailyMenuNote ?? base.dailyMenuNote,
    awards: barDetail.awards.length ? barDetail.awards : base.awards,
    venuePreferences: barDetail.venuePreferences.length
      ? barDetail.venuePreferences
      : base.venuePreferences,
    instagramUrl: barDetail.instagramUrl ?? base.instagramUrl,
    tiktokUrl: barDetail.tiktokUrl ?? base.tiktokUrl,
    tripadvisorUrl: barDetail.tripadvisorUrl ?? base.tripadvisorUrl,
  };
}

export function emptyVenueDetailFields(): VenueDetailDTO {
  return { ...EMPTY_DETAIL };
}
