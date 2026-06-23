/**
 * Resolución asistida de fichas TripAdvisor vía búsqueda DuckDuckGo (sin API TA).
 */

import {
  parseTripadvisorPlaceIdFromUrl,
  tripadvisorUrlFromPlaceId,
} from "@/lib/venues/external-ids";

const USER_AGENT = "Mozilla/5.0 (compatible; eltravieso/1.0; +https://eltravieso.com)";
const RATE_MS = Number(process.env.TRIPADVISOR_RESOLVE_RATE_MS ?? 2000);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let lastFetchAt = 0;

async function throttle() {
  const elapsed = Date.now() - lastFetchAt;
  if (elapsed < RATE_MS) await sleep(RATE_MS - elapsed);
  lastFetchAt = Date.now();
}

function normalizeListingPath(path: string): string {
  const trimmed = path.replace(/^\/+/, "");
  if (!trimmed.toLowerCase().startsWith("tripadvisor")) {
    return `https://www.tripadvisor.es/${trimmed}`;
  }
  return `https://${trimmed}`;
}

/** Extrae la primera URL de ficha Restaurant_Review del HTML de resultados. */
export function extractTripAdvisorListingUrl(html: string): string | null {
  const patterns = [
    /https?:\/\/(?:www\.)?tripadvisor\.[a-z.]+\/Restaurant_Review[^"'\s<>]+/gi,
    /tripadvisor\.[a-z.]+\/Restaurant_Review[^"'\s<>]+/gi,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[0]) continue;
    let url = match[0];
    if (!url.startsWith("http")) url = `https://${url}`;
    url = url.split(/[<>"']/)[0] ?? url;
    const placeId = parseTripadvisorPlaceIdFromUrl(url);
    if (placeId) return url;
  }
  return null;
}

export type TripAdvisorListingMatch = {
  url: string;
  placeId: string;
};

/** Busca ficha TA por nombre + ciudad (DuckDuckGo HTML). */
export async function resolveTripAdvisorListing(
  name: string,
  city: string,
): Promise<TripAdvisorListingMatch | null> {
  const query = encodeURIComponent(`site:tripadvisor.es ${name} ${city} Restaurant_Review`);
  await throttle();

  const res = await fetch(`https://html.duckduckgo.com/html/?q=${query}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    redirect: "follow",
  });

  if (!res.ok) return null;

  const html = await res.text();
  const rawUrl = extractTripAdvisorListingUrl(html);
  if (!rawUrl) return null;

  const placeId = parseTripadvisorPlaceIdFromUrl(rawUrl);
  if (!placeId) return null;

  return {
    url: rawUrl.includes("-Reviews") ? rawUrl : tripadvisorUrlFromPlaceId(placeId),
    placeId,
  };
}
