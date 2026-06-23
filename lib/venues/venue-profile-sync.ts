/**
 * Unifica el esquema legacy (venueType, dressCode, vibeTags) con la taxonomía
 * editorial (establishmentTypes[], venuePreferences[], idealFor[], venueFeatures[]).
 */

import {
  parseEstablishmentTypes,
  parseIdealFor,
  parseVenueFeatures,
  parseVenuePreferences,
  parseAwards,
} from "@/lib/venues/taxonomy";
import type { NormalizedVenueGuide, VenuePublicDTO } from "@/lib/venues/types";
import type { VenueDetailDTO } from "@/lib/venues/venue-detail-merge";
import { mapEditorialHeuristics } from "@/lib/venues/enrich-editorial-heuristics";

const LEGACY_VENUE_TYPE_TO_ESTABLISHMENT: Record<string, string> = {
  cocteleria: "cocteleria",
  restaurante: "restaurante",
  bar: "bar",
  bodega: "bodega",
};

/** Mapeo de vibeTags libres → slugs de taxonomía. */
const VIBE_TAG_MAP: Record<string, { idealFor?: string; feature?: string }> = {
  romantico: { idealFor: "romantico" },
  romántico: { idealFor: "romantico" },
  romantic: { idealFor: "romantico" },
  familias: { idealFor: "familias" },
  familiar: { idealFor: "familias" },
  family: { idealFor: "familias" },
  grupos: { idealFor: "grupos" },
  groups: { idealFor: "grupos" },
  afterwork: { idealFor: "afterwork" },
  negocios: { idealFor: "negocios" },
  business: { idealFor: "negocios" },
  celebraciones: { idealFor: "celebraciones" },
  turistas: { idealFor: "turistas" },
  tourists: { idealFor: "turistas" },
  brunch: { idealFor: "brunch" },
  terraza: { feature: "terraza_exterior" },
  terrace: { feature: "terraza_exterior" },
  "música en vivo": { feature: "musica_directo" },
  "musica en vivo": { feature: "musica_directo" },
  "live music": { feature: "musica_directo" },
  intimo: { feature: "ambiente_intimo" },
  íntimo: { feature: "ambiente_intimo" },
  intimate: { feature: "ambiente_intimo" },
  animado: { feature: "animado" },
  lively: { feature: "animado" },
  vistas: { feature: "vistas" },
  views: { feature: "vistas" },
  silencioso: { feature: "silencioso" },
  quiet: { feature: "silencioso" },
};

function uniqueStrings(...groups: (string[] | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const group of groups) {
    for (const item of group ?? []) {
      if (!item || seen.has(item)) continue;
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

/** Deriva establishmentTypes[] desde venueType legacy si el array está vacío. */
export function syncEstablishmentTypes(
  venueType: string,
  establishmentTypes: string[],
): string[] {
  if (establishmentTypes.length > 0) return establishmentTypes;
  const mapped = LEGACY_VENUE_TYPE_TO_ESTABLISHMENT[venueType];
  return mapped ? [mapped] : parseEstablishmentTypes([venueType]);
}

/** Mantiene venueType como etiqueta principal derivada de establishmentTypes. */
export function syncVenueType(venueType: string, establishmentTypes: string[]): string {
  if (venueType && LEGACY_VENUE_TYPE_TO_ESTABLISHMENT[venueType]) return venueType;
  return establishmentTypes[0] ?? venueType ?? "bar";
}

/** Añade slug dress_code si hay texto dressCode en BarProfile. */
export function syncVenuePreferences(
  venuePreferences: string[],
  dressCode?: string | null,
): string[] {
  const prefs = [...venuePreferences];
  if (dressCode?.trim() && !prefs.includes("dress_code")) {
    prefs.push("dress_code");
  }
  return parseVenuePreferences(prefs);
}

/** Inyecta galardón worlds50best si el local aparece en el ranking. */
export function syncAwardsForW50(awards: string[], hasW50Rank: boolean): string[] {
  if (!hasW50Rank) return awards;
  if (awards.includes("worlds50best")) return awards;
  return parseAwards([...awards, "worlds50best"]);
}

/** Fusiona vibeTags libres con idealFor/venueFeatures cuando hay alias conocido. */
export function syncVibeTagsToTaxonomy(
  vibeTags: string[],
  idealFor: string[],
  venueFeatures: string[],
): { vibeTags: string[]; idealFor: string[]; venueFeatures: string[] } {
  const extraIdeal: string[] = [];
  const extraFeatures: string[] = [];
  const unmapped: string[] = [];

  for (const raw of vibeTags) {
    const key = raw.toLowerCase().trim();
    const mapping = VIBE_TAG_MAP[key];
    if (mapping?.idealFor) extraIdeal.push(mapping.idealFor);
    else if (mapping?.feature) extraFeatures.push(mapping.feature);
    else if (raw.trim()) unmapped.push(raw.trim());
  }

  return {
    vibeTags: unmapped,
    idealFor: parseIdealFor(uniqueStrings(idealFor, extraIdeal)),
    venueFeatures: parseVenueFeatures(uniqueStrings(venueFeatures, extraFeatures)),
  };
}

export type DetailFieldArrays = Pick<
  VenueDetailDTO,
  | "establishmentTypes"
  | "cuisineTypes"
  | "starDishes"
  | "idealFor"
  | "venueFeatures"
  | "awards"
  | "venuePreferences"
>;

/** Une arrays de taxonomía sin duplicados (import enrich sobre datos existentes). */
export function mergeDetailFieldArrays(
  existing: Partial<DetailFieldArrays>,
  incoming: Partial<DetailFieldArrays>,
): DetailFieldArrays {
  return {
    establishmentTypes: uniqueStrings(existing.establishmentTypes, incoming.establishmentTypes),
    cuisineTypes: uniqueStrings(existing.cuisineTypes, incoming.cuisineTypes),
    starDishes: uniqueStrings(existing.starDishes, incoming.starDishes).slice(0, 5),
    idealFor: uniqueStrings(existing.idealFor, incoming.idealFor),
    venueFeatures: uniqueStrings(existing.venueFeatures, incoming.venueFeatures),
    awards: uniqueStrings(existing.awards, incoming.awards),
    venuePreferences: uniqueStrings(existing.venuePreferences, incoming.venuePreferences),
  };
}

/** Enriquece un registro scrapeado/normalizado con derivaciones del esquema legacy. */
export function enrichGuideFromScrape(guide: NormalizedVenueGuide): NormalizedVenueGuide {
  const establishmentTypes = syncEstablishmentTypes(
    guide.venueType,
    guide.establishmentTypes ?? [],
  );
  const awards = syncAwardsForW50(guide.awards ?? [], Boolean(guide.worlds50bestRank));
  const editorial = mapEditorialHeuristics({
    name: guide.name,
    history: guide.history,
    verdict: guide.verdict,
    chefName: guide.chefName,
  });
  const merged = mergeDetailFieldArrays(
    {
      establishmentTypes,
      cuisineTypes: guide.cuisineTypes,
      starDishes: guide.starDishes,
      idealFor: guide.idealFor,
      venueFeatures: guide.venueFeatures,
      awards,
      venuePreferences: guide.venuePreferences,
    },
    editorial,
  );

  return {
    ...guide,
    venueType: syncVenueType(guide.venueType, establishmentTypes),
    establishmentTypes: merged.establishmentTypes,
    cuisineTypes: merged.cuisineTypes,
    starDishes: merged.starDishes,
    idealFor: merged.idealFor,
    venueFeatures: merged.venueFeatures,
    neighborhood: guide.neighborhood ?? null,
    priceRange: guide.priceRange ?? null,
    dailyMenuEnabled: guide.dailyMenuEnabled ?? false,
    dailyMenuNote: guide.dailyMenuNote ?? null,
    awards: merged.awards,
    venuePreferences: guide.venuePreferences ?? [],
    instagramUrl: guide.instagramUrl ?? null,
    tiktokUrl: guide.tiktokUrl ?? null,
  };
}

/** Aplica unificación al DTO público (lectura en catalog/UI). */
export function applyVenueProfileSync(venue: VenuePublicDTO): VenuePublicDTO {
  const establishmentTypes = syncEstablishmentTypes(venue.venueType, venue.establishmentTypes);
  const venueType = syncVenueType(venue.venueType, establishmentTypes);
  const venuePreferences = syncVenuePreferences(venue.venuePreferences, venue.dressCode);
  const awards = syncAwardsForW50(venue.awards, Boolean(venue.worlds50bestRank));
  const vibe = syncVibeTagsToTaxonomy(venue.vibeTags, venue.idealFor, venue.venueFeatures);

  return {
    ...venue,
    venueType,
    establishmentTypes,
    venuePreferences,
    awards,
    vibeTags: vibe.vibeTags,
    idealFor: vibe.idealFor,
    venueFeatures: vibe.venueFeatures,
  };
}
