import type { MapVenueDTO } from "@/lib/venues/types";

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Prefer affiliate pin when slug or venueCode collides with editorial. */
export function dedupeMapVenues(affiliates: MapVenueDTO[], editorial: MapVenueDTO[]): MapVenueDTO[] {
  const affiliateSlugs = new Set(affiliates.map((v) => v.slug));
  const affiliateCodes = new Set(
    affiliates.map((v) => v.venueCode).filter((code): code is string => Boolean(code)),
  );

  const filteredEditorial = editorial.filter((venue) => {
    if (affiliateSlugs.has(venue.slug)) return false;
    if (venue.venueCode && affiliateCodes.has(venue.venueCode)) return false;
    return true;
  });

  const seen = new Set<string>();
  const merged = [...affiliates, ...filteredEditorial];

  return merged.filter((venue) => {
    const key = venue.venueCode
      ? `code:${venue.venueCode}`
      : `slug:${normalizeKey(venue.slug)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
