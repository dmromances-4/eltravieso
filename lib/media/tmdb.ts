const TMDB_BASE = process.env.TMDB_API_BASE ?? "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";

function apiKey() {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY no configurada");
  return key;
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", apiKey());
  url.searchParams.set("language", "es-ES");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export type TmdbSearchResult = {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
};

export async function searchTmdb(query: string) {
  const data = await tmdbFetch<{ results: TmdbSearchResult[] }>("/search/multi", { query });
  return data.results.filter((r) => r.media_type === "movie" || r.media_type === "tv");
}

export async function getTmdbMovie(id: number) {
  return tmdbFetch<{
    id: number;
    title: string;
    overview?: string;
    poster_path?: string | null;
    release_date?: string;
    runtime?: number;
    imdb_id?: string;
    genres?: { name: string }[];
  }>(`/movie/${id}`, { append_to_response: "external_ids" });
}

export async function getTmdbTv(id: number) {
  return tmdbFetch<{
    id: number;
    name: string;
    overview?: string;
    poster_path?: string | null;
    first_air_date?: string;
    number_of_seasons?: number;
    external_ids?: { imdb_id?: string };
    genres?: { name: string }[];
  }>(`/tv/${id}`, { append_to_response: "external_ids" });
}

export async function getTmdbSeason(tvId: number, seasonNumber: number) {
  return tmdbFetch<{
    episodes: {
      id: number;
      name: string;
      overview?: string;
      season_number: number;
      episode_number: number;
      runtime?: number;
      still_path?: string | null;
    }[];
  }>(`/tv/${tvId}/season/${seasonNumber}`);
}

export function tmdbPosterUrl(path?: string | null) {
  if (!path) return null;
  return `${TMDB_IMAGE}${path}`;
}

export function yearFromDate(date?: string) {
  if (!date) return null;
  const y = Number(date.slice(0, 4));
  return Number.isFinite(y) ? y : null;
}
