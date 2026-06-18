/**
 * Validación y normalización de identificadores externos de locales.
 */

export type IdValidationResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

/** Código interno El Travieso: ET-LOC-00001 */
export const VENUE_CODE_PATTERN = /^ET-LOC-\d{5}$/;

export function validateVenueCode(raw: unknown): IdValidationResult {
  const value = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  if (!value) return { ok: false, error: "El código de local es obligatorio." };
  if (!VENUE_CODE_PATTERN.test(value)) {
    return { ok: false, error: "Formato inválido. Usa ET-LOC-00001 (5 dígitos)." };
  }
  return { ok: true, value };
}

/**
 * Google Business / Places ID.
 * Acepta Place ID (ChIJ…) o ID numérico de ficha (10–20 dígitos).
 */
export function validateGoogleBusinessId(raw: unknown): IdValidationResult {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return { ok: true, value: "" };

  if (/^ChIJ[\w-]{20,}$/i.test(value)) {
    return { ok: true, value };
  }
  if (/^\d{10,20}$/.test(value)) {
    return { ok: true, value };
  }

  return {
    ok: false,
    error: "ID de Google no válido. Usa un Place ID (ChIJ…) o el ID numérico de la ficha.",
  };
}

/**
 * TripAdvisor location ID (ej. d12345678).
 * También acepta URL y extrae el ID.
 */
export function validateTripadvisorPlaceId(raw: unknown): IdValidationResult {
  const input = typeof raw === "string" ? raw.trim() : "";
  if (!input) return { ok: true, value: "" };

  const fromUrl = parseTripadvisorPlaceIdFromUrl(input);
  const candidate = fromUrl ?? input;

  if (/^d\d{5,12}$/i.test(candidate)) {
    return { ok: true, value: candidate.toLowerCase() };
  }

  return {
    ok: false,
    error: "ID de TripAdvisor no válido. Usa d12345678 o la URL de la ficha.",
  };
}

export function parseTripadvisorPlaceIdFromUrl(url: string): string | null {
  try {
    const match = url.match(/-d(\d{5,12})/i);
    if (match) return `d${match[1]}`;
  } catch {
    // ignore
  }
  return null;
}

export function tripadvisorUrlFromPlaceId(placeId: string): string {
  const id = placeId.toLowerCase().replace(/^d/, "");
  return `https://www.tripadvisor.es/Restaurant_Review-d${id}-Reviews.html`;
}

export function formatVenueCode(sequence: number): string {
  return `ET-LOC-${String(sequence).padStart(5, "0")}`;
}

export function parseVenueCodeSequence(code: string | null | undefined): number {
  if (!code) return 0;
  const match = code.match(/^ET-LOC-(\d+)$/i);
  return match ? Number(match[1]) : 0;
}
