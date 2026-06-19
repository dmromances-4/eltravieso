const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "VermutElTravieso/1.0 (local-dev; contact@eltravieso.bar)";

let lastRequestAt = 0;

export type GeocodeConfidence = "high" | "medium" | "low";

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  confidence: GeocodeConfidence;
};

async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
  }
  lastRequestAt = Date.now();
}

async function searchNominatim(query: string): Promise<GeocodeResult | null> {
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

    return { latitude, longitude, confidence: "medium" };
  } catch (error) {
    console.error("[geocode] Nominatim error:", error);
    return null;
  }
}

export async function geocodeAddress(parts: {
  address: string;
  city: string;
  postalCode?: string;
  province?: string;
  country?: string;
  name?: string;
  /** Si es `null`, no se añade país por defecto (útil para locales internacionales). */
  defaultCountry?: string | null;
  confidence?: GeocodeConfidence;
}): Promise<GeocodeResult | null> {
  const country =
    parts.country ??
    (parts.defaultCountry === null ? undefined : (parts.defaultCountry ?? "España"));

  const query = [parts.address, parts.postalCode, parts.city, parts.province, country]
    .filter(Boolean)
    .join(", ");

  const result = await searchNominatim(query);
  if (!result) return null;

  return {
    ...result,
    confidence: parts.confidence ?? result.confidence,
  };
}

export async function geocodeVenue(parts: {
  name: string;
  address?: string | null;
  city: string;
  country?: string | null;
}): Promise<GeocodeResult | null> {
  const country = parts.country ?? undefined;
  const base = { city: parts.city, country, defaultCountry: null };

  const strategies: Array<{ address: string; confidence: GeocodeConfidence; name?: string }> = [];

  if (parts.address) {
    strategies.push({
      address: parts.address,
      confidence: "high",
      name: parts.name,
    });
    strategies.push({
      address: `${parts.name}, ${parts.address}`,
      confidence: "high",
    });
    if (country) {
      strategies.push({
        address: `${parts.address}, ${parts.city}, ${country}`,
        confidence: "high",
      });
    }
  }

  if (country) {
    strategies.push({
      address: `${parts.name}, ${parts.city}, ${country}`,
      confidence: parts.address ? "medium" : "high",
    });
  }

  strategies.push({
    address: `${parts.name}, ${parts.city}`,
    confidence: parts.address ? "medium" : "low",
  });

  if (parts.city && country) {
    strategies.push({
      address: `${parts.city}, ${country}`,
      confidence: "low",
    });
  }

  if (parts.city) {
    strategies.push({ address: parts.name, confidence: "low" });
  }

  for (const strategy of strategies) {
    const coords = await geocodeAddress({
      ...base,
      address: strategy.address,
      name: strategy.name ?? parts.name,
      confidence: strategy.confidence,
    });
    if (coords) return coords;
  }

  return null;
}
