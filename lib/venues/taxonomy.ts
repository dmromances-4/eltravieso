/** Taxonomía editorial de locales — fuentes futuras: Google Places, TripAdvisor. */

export type TaxonomyOption = { id: string; label: string };

export const VENUE_ESTABLISHMENT_TYPES: TaxonomyOption[] = [
  { id: "restaurante", label: "Restaurante" },
  { id: "cocteleria", label: "Coctelería" },
  { id: "cafeteria", label: "Cafetería" },
  { id: "bar", label: "Bar" },
  { id: "bodega", label: "Bodega" },
  { id: "taberna", label: "Taberna" },
  { id: "gastrobar", label: "Gastrobar" },
  { id: "vinoteca", label: "Vinoteca" },
  { id: "club", label: "Club" },
  { id: "hotel_bar", label: "Bar de hotel" },
  { id: "beach_club", label: "Beach club" },
];

export const VENUE_CUISINE_TYPES: TaxonomyOption[] = [
  { id: "mediterranea", label: "Mediterránea" },
  { id: "espanola", label: "Española" },
  { id: "italiana", label: "Italiana" },
  { id: "japonesa", label: "Japonesa" },
  { id: "asiatica", label: "Asiática" },
  { id: "mexicana", label: "Mexicana" },
  { id: "latinoamericana", label: "Latinoamericana" },
  { id: "fusion", label: "Fusión" },
  { id: "internacional", label: "Internacional" },
  { id: "vegana", label: "Vegana" },
  { id: "tapas", label: "Tapas" },
  { id: "marisqueria", label: "Marisquería" },
  { id: "asador", label: "Asador" },
  { id: "francesa", label: "Francesa" },
  { id: "peruana", label: "Peruana" },
  { id: "thai", label: "Tailandesa" },
  { id: "india", label: "India" },
  { id: "griega", label: "Griega" },
  { id: "americana", label: "Americana" },
];

export const VENUE_IDEAL_FOR: TaxonomyOption[] = [
  { id: "romantico", label: "Romántico" },
  { id: "familias", label: "Familias" },
  { id: "negocios", label: "Negocios" },
  { id: "grupos", label: "Grupos" },
  { id: "afterwork", label: "Afterwork" },
  { id: "celebraciones", label: "Celebraciones" },
  { id: "turistas", label: "Turistas" },
  { id: "solo", label: "Comer solo" },
  { id: "parejas", label: "Parejas" },
  { id: "brunch", label: "Brunch" },
];

export const VENUE_FEATURES: TaxonomyOption[] = [
  { id: "terraza_exterior", label: "Terraza exterior" },
  { id: "terraza_interior", label: "Terraza interior" },
  { id: "vistas", label: "Vistas" },
  { id: "musica_directo", label: "Música en directo" },
  { id: "ambiente_intimo", label: "Ambiente íntimo" },
  { id: "animado", label: "Animado" },
  { id: "silencioso", label: "Silencioso" },
  { id: "copas_fuera", label: "Copas al aire libre" },
];

export const VENUE_PRICE_RANGES: TaxonomyOption[] = [
  { id: "under_15", label: "<15€" },
  { id: "range_15_30", label: "15–30€" },
  { id: "range_30_50", label: "30–50€" },
  { id: "over_50", label: "+50€" },
];

export const VENUE_AWARDS: TaxonomyOption[] = [
  { id: "michelin", label: "Guía Michelin" },
  { id: "soles_repsol", label: "Soles Repsol" },
  { id: "bib_gourmand", label: "Bib Gourmand" },
  { id: "green_star", label: "Estrella Verde Michelin" },
  { id: "worlds50best", label: "World's 50 Best" },
  { id: "premio_reina_sofia", label: "Premio Reina Sofía" },
];

export type VenuePreferenceGroup = {
  id: string;
  title: string;
  options: TaxonomyOption[];
};

export const VENUE_PREFERENCE_GROUPS: VenuePreferenceGroup[] = [
  {
    id: "dietary",
    title: "Preferencias e intolerancias alimentarias",
    options: [
      { id: "vegan", label: "Opciones veganas" },
      { id: "lactose_free", label: "Opciones sin lactosa" },
      { id: "kosher", label: "Comida kosher" },
      { id: "low_sodium", label: "Bajo en sodio" },
      { id: "allergy_friendly", label: "Adaptable a alergias" },
      { id: "vegetarian", label: "Opciones vegetarianas" },
      { id: "gluten_free", label: "Opciones sin gluten" },
      { id: "halal", label: "Comida halal" },
      { id: "pescatarian", label: "Pescetariano" },
    ],
  },
  {
    id: "accessibility",
    title: "Accesibilidad",
    options: [
      { id: "wheelchair", label: "Acceso para sillas de ruedas" },
      { id: "parking", label: "Estacionamiento" },
      { id: "public_transit", label: "Acceso transporte público" },
      { id: "accessible_restroom", label: "Baño accesible" },
      { id: "valet", label: "Aparcacoches" },
    ],
  },
  {
    id: "pets",
    title: "Mascotas",
    options: [{ id: "pets_allowed", label: "Mascotas admitidas" }],
  },
  {
    id: "kids",
    title: "Niños",
    options: [
      { id: "kids_welcome", label: "Niños" },
      { id: "high_chair", label: "Trona" },
      { id: "stroller_friendly", label: "Cochecito de bebé" },
    ],
  },
  {
    id: "facilities",
    title: "Instalaciones",
    options: [
      { id: "smoking_area", label: "Zona de fumadores" },
      { id: "climate_control", label: "Zona climatizada" },
      { id: "dress_code", label: "Dress code" },
    ],
  },
  {
    id: "payments",
    title: "Pagos",
    options: [
      { id: "card_payment", label: "Tarjeta" },
      { id: "cash_payment", label: "Efectivo" },
      { id: "mobile_payment", label: "Pago móvil" },
      { id: "contactless", label: "Sin contacto" },
    ],
  },
  {
    id: "events",
    title: "Eventos",
    options: [
      { id: "sports_broadcast", label: "Transmisión deportiva" },
      { id: "live_show", label: "Espectáculo" },
    ],
  },
];

const ALL_OPTION_IDS = new Set([
  ...VENUE_ESTABLISHMENT_TYPES,
  ...VENUE_CUISINE_TYPES,
  ...VENUE_IDEAL_FOR,
  ...VENUE_FEATURES,
  ...VENUE_AWARDS,
  ...VENUE_PREFERENCE_GROUPS.flatMap((g) => g.options),
].map((o) => o.id));

const PRICE_RANGE_IDS = new Set(VENUE_PRICE_RANGES.map((o) => o.id));

export function labelForVenueOption(id: string): string {
  const all = [
    ...VENUE_ESTABLISHMENT_TYPES,
    ...VENUE_CUISINE_TYPES,
    ...VENUE_IDEAL_FOR,
    ...VENUE_FEATURES,
    ...VENUE_PRICE_RANGES,
    ...VENUE_AWARDS,
    ...VENUE_PREFERENCE_GROUPS.flatMap((g) => g.options),
  ];
  return all.find((o) => o.id === id)?.label ?? id;
}

export function labelForPriceRange(id: string | null | undefined): string | null {
  if (!id) return null;
  return VENUE_PRICE_RANGES.find((o) => o.id === id)?.label ?? id;
}

export function filterTaxonomyIds(raw: unknown, allowed: Set<string>): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item).trim();
    if (!id || !allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function parseEstablishmentTypes(raw: unknown): string[] {
  return filterTaxonomyIds(raw, new Set(VENUE_ESTABLISHMENT_TYPES.map((o) => o.id)));
}

export function parseCuisineTypes(raw: unknown): string[] {
  return filterTaxonomyIds(raw, new Set(VENUE_CUISINE_TYPES.map((o) => o.id)));
}

export function parseIdealFor(raw: unknown): string[] {
  return filterTaxonomyIds(raw, new Set(VENUE_IDEAL_FOR.map((o) => o.id)));
}

export function parseVenueFeatures(raw: unknown): string[] {
  return filterTaxonomyIds(raw, new Set(VENUE_FEATURES.map((o) => o.id)));
}

export function parseAwards(raw: unknown): string[] {
  return filterTaxonomyIds(raw, new Set(VENUE_AWARDS.map((o) => o.id)));
}

export function parseVenuePreferences(raw: unknown): string[] {
  const allowed = new Set(
    VENUE_PREFERENCE_GROUPS.flatMap((g) => g.options.map((o) => o.id)),
  );
  return filterTaxonomyIds(raw, allowed);
}

export function parsePriceRange(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const id = raw.trim();
  return PRICE_RANGE_IDS.has(id) ? id : null;
}

export function parseStarDishes(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    if (typeof raw === "string") {
      return raw
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5);
    }
    return [];
  }
  return raw
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export function normalizeSocialHandle(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("@")) {
    const handle = trimmed.slice(1);
    return handle ? `https://instagram.com/${handle}` : null;
  }
  if (/^[a-zA-Z0-9._]+$/.test(trimmed)) {
    return `https://instagram.com/${trimmed}`;
  }
  return trimmed;
}

export function normalizeTikTokHandle(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const handle = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  return handle ? `https://www.tiktok.com/@${handle}` : null;
}
