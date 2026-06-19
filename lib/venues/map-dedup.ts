import type { MapVenueDTO } from "@/lib/venues/types";
import { normalizeVenueKey } from "@/lib/venues/unique-slug";

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function mapVenueIdentityKey(venue: Pick<MapVenueDTO, "name" | "city" | "venueType">): string {
  return `${normalizeVenueKey(venue.name, venue.city)}::${venue.venueType}`;
}

/** Prefer affiliate pin when slug, venueCode or identity (name+city+type) collides with editorial. */
export function dedupeMapVenues(affiliates: MapVenueDTO[], editorial: MapVenueDTO[]): MapVenueDTO[] {
  const affiliateSlugs = new Set(affiliates.map((v) => v.slug));
  const affiliateCodes = new Set(
    affiliates.map((v) => v.venueCode).filter((code): code is string => Boolean(code)),
  );
  const affiliateIdentities = new Set(affiliates.map((v) => mapVenueIdentityKey(v)));

  const filteredEditorial = editorial.filter((venue) => {
    if (affiliateSlugs.has(venue.slug)) return false;
    if (venue.venueCode && affiliateCodes.has(venue.venueCode)) return false;
    if (affiliateIdentities.has(mapVenueIdentityKey(venue))) return false;
    return true;
  });

  const seen = new Set<string>();
  const merged = [...affiliates, ...filteredEditorial];

  return merged.filter((venue) => {
    const keys = [
      venue.venueCode ? `code:${venue.venueCode}` : null,
      `slug:${normalizeKey(venue.slug)}`,
      `identity:${mapVenueIdentityKey(venue)}`,
    ].filter(Boolean) as string[];

    if (keys.some((key) => seen.has(key))) return false;
    for (const key of keys) seen.add(key);
    return true;
  });
}
