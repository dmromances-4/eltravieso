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

export type ContinentFilter = "" | VenueContinent;

export const CONTINENT_FILTER_OPTIONS: { value: ContinentFilter; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "GLOBAL", label: CONTINENT_LABELS.GLOBAL },
  { value: "EUROPE", label: CONTINENT_LABELS.EUROPE },
  { value: "ASIA", label: CONTINENT_LABELS.ASIA },
  { value: "NORTH_AMERICA", label: CONTINENT_LABELS.NORTH_AMERICA },
  { value: "LATIN_AMERICA", label: CONTINENT_LABELS.LATIN_AMERICA },
  { value: "MIDDLE_EAST_AFRICA", label: CONTINENT_LABELS.MIDDLE_EAST_AFRICA },
  { value: "OCEANIA", label: CONTINENT_LABELS.OCEANIA },
];

export type ContinentCamera = {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
};

export const CONTINENT_CAMERA: Record<VenueContinent, ContinentCamera> = {
  GLOBAL: { longitude: 10, latitude: 20, zoom: 1.2, pitch: 0 },
  EUROPE: { longitude: 10, latitude: 48, zoom: 3.5, pitch: 35 },
  ASIA: { longitude: 105, latitude: 15, zoom: 2.8, pitch: 30 },
  NORTH_AMERICA: { longitude: -98, latitude: 40, zoom: 2.8, pitch: 30 },
  LATIN_AMERICA: { longitude: -60, latitude: -15, zoom: 2.8, pitch: 30 },
  MIDDLE_EAST_AFRICA: { longitude: 35, latitude: 15, zoom: 2.5, pitch: 30 },
  OCEANIA: { longitude: 145, latitude: -25, zoom: 3, pitch: 30 },
};

export const REGIONAL_LIST_LABELS: Partial<Record<VenueContinent, Record<string, string>>> = {
  ASIA: { BARS: "Asia's 50 Best Bars", RESTAURANTS: "Asia's 50 Best Restaurants" },
  NORTH_AMERICA: {
    BARS: "North America's 50 Best Bars",
    RESTAURANTS: "North America's 50 Best Restaurants",
  },
  EUROPE: { BARS: "Europe's 50 Best Bars", RESTAURANTS: "Europe's 50 Best Restaurants" },
  LATIN_AMERICA: { RESTAURANTS: "Latin America's 50 Best Restaurants" },
  MIDDLE_EAST_AFRICA: {
    BARS: "Middle East & Africa's 50 Best Bars",
    RESTAURANTS: "Middle East & Africa's 50 Best Restaurants",
  },
  OCEANIA: {
    BARS: "Oceania's 50 Best Bars",
    RESTAURANTS: "Oceania's 50 Best Restaurants",
  },
};
