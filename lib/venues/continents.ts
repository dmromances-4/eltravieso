import type { VenueContinent } from "@prisma/client";

const EUROPEAN_COUNTRIES = new Set([
  "spain",
  "españa",
  "france",
  "italy",
  "italia",
  "germany",
  "deutschland",
  "united kingdom",
  "uk",
  "england",
  "scotland",
  "wales",
  "ireland",
  "portugal",
  "netherlands",
  "belgium",
  "switzerland",
  "austria",
  "sweden",
  "norway",
  "denmark",
  "finland",
  "poland",
  "czech republic",
  "czechia",
  "hungary",
  "greece",
  "turkey",
  "türkiye",
  "croatia",
  "serbia",
  "romania",
  "bulgaria",
  "iceland",
  "luxembourg",
  "monaco",
  "andorra",
  "malta",
  "cyprus",
  "estonia",
  "latvia",
  "lithuania",
  "slovakia",
  "slovenia",
]);

const EUROPEAN_CITIES = new Set([
  "london",
  "paris",
  "barcelona",
  "madrid",
  "rome",
  "roma",
  "milan",
  "milano",
  "berlin",
  "amsterdam",
  "lisbon",
  "lisboa",
  "vienna",
  "wien",
  "prague",
  "copenhagen",
  "stockholm",
  "athens",
  "dublin",
  "edinburgh",
  "manchester",
  "lyon",
  "marseille",
  "naples",
  "napoli",
  "florence",
  "firenze",
  "zurich",
  "geneva",
  "brussels",
  "oslo",
  "helsinki",
  "warsaw",
  "budapest",
  "istanbul",
  "porto",
  "seville",
  "sevilla",
  "valencia",
  "bilbao",
  "san sebastian",
  "donostia",
]);

function norm(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function isEuropeanVenue(country?: string | null, city?: string | null): boolean {
  if (country && EUROPEAN_COUNTRIES.has(norm(country))) return true;
  if (city && EUROPEAN_CITIES.has(norm(city))) return true;
  return false;
}

export const CONTINENT_LABELS: Record<VenueContinent, string> = {
  GLOBAL: "Global",
  EUROPE: "Europa",
  ASIA: "Asia",
  NORTH_AMERICA: "Norteamérica",
  LATIN_AMERICA: "Latinoamérica",
  MIDDLE_EAST_AFRICA: "Oriente Medio y África",
  OCEANIA: "Oceanía",
};

export const REGIONAL_LIST_LABELS: Partial<Record<VenueContinent, Record<string, string>>> = {
  ASIA: { BARS: "Asia's 50 Best Bars", RESTAURANTS: "Asia's 50 Best Restaurants" },
  NORTH_AMERICA: {
    BARS: "North America's 50 Best Bars",
    RESTAURANTS: "North America's 50 Best Restaurants",
  },
  EUROPE: { BARS: "Europe's 50 Best Bars", RESTAURANTS: "Europe's 50 Best Restaurants" },
  LATIN_AMERICA: { RESTAURANTS: "Latin America's 50 Best Restaurants" },
};
