/**
 * Fuerza client_encoding=UTF8 en conexiones PostgreSQL.
 * En Windows, sin esto Prisma puede usar WIN1252 y fallar con texto internacional.
 */
export function ensureUtf8DatabaseUrl(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  if (/client_encoding=/i.test(trimmed) || /client_encoding%3D/i.test(trimmed)) {
    return trimmed;
  }
  const separator = trimmed.includes("?") ? "&" : "?";
  // libpq: options=-c client_encoding=UTF8
  return `${trimmed}${separator}options=-c%20client_encoding%3DUTF8`;
}

/** Normaliza Unicode NFC (evita fallos con acentos NFD tipo "Factoría"). */
export function normalizeUnicodeNfc(value: string | null | undefined): string | null {
  if (value == null) return null;
  const text = String(value);
  return text.normalize("NFC");
}

export function normalizeUnicodeFields<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data };
  for (const [key, value] of Object.entries(out)) {
    if (typeof value === "string") {
      (out as Record<string, unknown>)[key] = normalizeUnicodeNfc(value);
    }
  }
  return out;
}

