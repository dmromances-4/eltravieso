/**
 * Scoring de candidatos Google Places vs locales editoriales.
 */

export type VenueMatchInput = {
  name: string;
  city: string;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  venueType?: string;
};

export type PlaceMatchCandidate = {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  types: string[];
};

const VENUE_COMPATIBLE_TYPES = new Set([
  "restaurant",
  "bar",
  "cafe",
  "night_club",
  "meal_takeaway",
  "meal_delivery",
  "food",
  "wine_bar",
  "cocktail_bar",
]);

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|el|la|los|las|restaurant|restaurante|bar|cafe|cafeteria)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameSimilarity(a: string, b: string): number {
  const left = normalizeForMatch(a);
  const right = normalizeForMatch(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.92;

  const tokensLeft = new Set(left.split(" ").filter(Boolean));
  const tokensRight = new Set(right.split(" ").filter(Boolean));
  let overlap = 0;
  for (const token of tokensLeft) {
    if (tokensRight.has(token)) overlap += 1;
  }
  const union = tokensLeft.size + tokensRight.size - overlap;
  return union > 0 ? overlap / union : 0;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusM = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusM * Math.asin(Math.sqrt(a));
}

function distanceScore(meters: number): number {
  if (meters <= 100) return 1;
  if (meters <= 500) return 0.9;
  if (meters <= 1_000) return 0.7;
  if (meters <= 2_000) return 0.4;
  return 0;
}

function cityInAddress(city: string, address: string, country?: string | null): number {
  const normalizedAddress = normalizeForMatch(address);
  const normalizedCity = normalizeForMatch(city);
  if (normalizedCity && normalizedAddress.includes(normalizedCity)) return 1;
  if (country) {
    const normalizedCountry = normalizeForMatch(country);
    if (normalizedCountry && normalizedAddress.includes(normalizedCountry)) return 0.5;
  }
  return 0;
}

function typeScore(types: string[]): number {
  if (types.some((type) => VENUE_COMPATIBLE_TYPES.has(type))) return 1;
  return 0.3;
}

/** Devuelve un score 0–1 para decidir auto-asignación de Place ID. */
export function scorePlaceMatch(venue: VenueMatchInput, candidate: PlaceMatchCandidate): number {
  const name = nameSimilarity(venue.name, candidate.displayName);
  const city = cityInAddress(venue.city, candidate.formattedAddress, venue.country);
  const type = typeScore(candidate.types);

  let distance = 0.5;
  if (venue.latitude != null && venue.longitude != null) {
    const meters = haversineMeters(
      venue.latitude,
      venue.longitude,
      candidate.latitude,
      candidate.longitude,
    );
    distance = distanceScore(meters);
  }

  return name * 0.45 + city * 0.2 + distance * 0.25 + type * 0.1;
}

export function googlePlacesAutoMinScore(): number {
  const raw = Number(process.env.GOOGLE_PLACES_AUTO_MIN_SCORE ?? 0.88);
  return Number.isFinite(raw) && raw > 0 && raw <= 1 ? raw : 0.88;
}
