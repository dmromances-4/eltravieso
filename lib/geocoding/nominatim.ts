const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "VermutElTravieso/1.0 (local-dev; contact@eltravieso.bar)";

let lastRequestAt = 0;

async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
  }
  lastRequestAt = Date.now();
}

export type GeocodeResult = {
  latitude: number;
  longitude: number;
};

export async function geocodeAddress(parts: {
  address: string;
  city: string;
  postalCode?: string;
  province?: string;
  country?: string;
  /** Si es `null`, no se añade país por defecto (útil para locales internacionales). */
  defaultCountry?: string | null;
}): Promise<GeocodeResult | null> {
  const country =
    parts.country ??
    (parts.defaultCountry === null ? undefined : (parts.defaultCountry ?? "España"));
  const query = [parts.address, parts.postalCode, parts.city, parts.province, country]
    .filter(Boolean)
    .join(", ");

  await rateLimit();

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;

    const latitude = Number(data[0].lat);
    const longitude = Number(data[0].lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return { latitude, longitude };
  } catch (error) {
    console.error("[geocode] Nominatim error:", error);
    return null;
  }
}
