import type { Worlds50BestCategory } from "@prisma/client";
import { mergeVenueGuides } from "@/lib/venues/merge-guide";
import type { NormalizedVenueGuide } from "@/lib/venues/types";
import { normalizeVenueKey } from "@/lib/venues/unique-slug";

export type VenueCanonicalMerge = {
  identityKey: string;
  canonicalSlug: string;
  canonicalSourceUrl: string;
  mergedSlugs: string[];
  mergedSourceUrls: string[];
};

export type UnifyVenueListResult = {
  venues: NormalizedVenueGuide[];
  merges: VenueCanonicalMerge[];
  identityMergeCount: number;
};

export function venueIdentityKey(venue: Pick<NormalizedVenueGuide, "name" | "city" | "worlds50bestCategory">): string {
  const category = venue.worlds50bestCategory ?? "BARS";
  return `${normalizeVenueKey(venue.name, venue.city)}::${category}`;
}

function slugNumericSuffix(slug: string): number {
  const match = slug.match(/-(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function taxonomyScore(venue: NormalizedVenueGuide): number {
  let score = 0;
  if (venue.establishmentTypes?.length) score += 1;
  if (venue.cuisineTypes?.length) score += 1;
  if (venue.venuePreferences?.length) score += 2;
  if (venue.tripadvisorUrl) score += 2;
  if (venue.priceRange) score += 1;
  return score;
}

function editorialScore(venue: NormalizedVenueGuide): number {
  return (venue.history?.length ?? 0) + (venue.verdict?.length ?? 0);
}

/** Mayor puntuación = mejor candidato a registro canónico. */
export function scoreCanonicalCandidate(venue: NormalizedVenueGuide): number {
  let score = 0;
  if (venue.listScope === "GLOBAL") score += 1000;
  if (venue.venueCode) score += 500;
  if (venue.latitude != null && venue.longitude != null) score += 200;
  score += taxonomyScore(venue) * 10;
  score += Math.min(editorialScore(venue), 100);
  score -= slugNumericSuffix(venue.slug) * 5;
  return score;
}

export function compareCanonicalCandidates(a: NormalizedVenueGuide, b: NormalizedVenueGuide): number {
  return scoreCanonicalCandidate(b) - scoreCanonicalCandidate(a);
}

export function pickCanonicalVenue(siblings: NormalizedVenueGuide[]): NormalizedVenueGuide {
  if (siblings.length === 0) {
    throw new Error("pickCanonicalVenue requires at least one venue");
  }
  return [...siblings].sort(compareCanonicalCandidates)[0];
}

export function mergeVenueSiblings(siblings: NormalizedVenueGuide[]): NormalizedVenueGuide {
  if (siblings.length === 0) {
    throw new Error("mergeVenueSiblings requires at least one venue");
  }
  if (siblings.length === 1) return { ...siblings[0] };

  const winner = pickCanonicalVenue(siblings);
  const ordered = [winner, ...siblings.filter((v) => v.sourceUrl !== winner.sourceUrl).sort(compareCanonicalCandidates)];

  const merged = ordered.reduce<NormalizedVenueGuide | undefined>(
    (acc, venue) => (acc ? mergeVenueGuides(acc, venue) : { ...venue }),
    undefined,
  )!;

  return {
    ...merged,
    slug: winner.slug,
    sourceUrl: winner.sourceUrl,
  };
}

export function unifyVenueList(venues: NormalizedVenueGuide[]): UnifyVenueListResult {
  const groups = new Map<string, NormalizedVenueGuide[]>();

  for (const venue of venues) {
    const key = venueIdentityKey(venue);
    const list = groups.get(key) ?? [];
    list.push(venue);
    groups.set(key, list);
  }

  const canonical: NormalizedVenueGuide[] = [];
  const merges: VenueCanonicalMerge[] = [];
  let identityMergeCount = 0;

  for (const [identityKey, siblings] of groups) {
    if (siblings.length === 1) {
      canonical.push(siblings[0]);
      continue;
    }

    identityMergeCount += siblings.length - 1;
    const merged = mergeVenueSiblings(siblings);
    const winner = pickCanonicalVenue(siblings);

    merges.push({
      identityKey,
      canonicalSlug: merged.slug,
      canonicalSourceUrl: merged.sourceUrl,
      mergedSlugs: siblings.filter((v) => v.slug !== winner.slug).map((v) => v.slug),
      mergedSourceUrls: siblings.filter((v) => v.sourceUrl !== winner.sourceUrl).map((v) => v.sourceUrl),
    });

    canonical.push(merged);
  }

  canonical.sort((a, b) => a.slug.localeCompare(b.slug));

  return { venues: canonical, merges, identityMergeCount };
}

export function groupVenuesByIdentity(
  venues: NormalizedVenueGuide[],
): Map<string, NormalizedVenueGuide[]> {
  const groups = new Map<string, NormalizedVenueGuide[]>();
  for (const venue of venues) {
    const key = venueIdentityKey(venue);
    const list = groups.get(key) ?? [];
    list.push(venue);
    groups.set(key, list);
  }
  return groups;
}

export function venueIdentityKeyFromParts(
  name: string,
  city: string,
  category: Worlds50BestCategory,
): string {
  return `${normalizeVenueKey(name, city)}::${category}`;
}
