import fs from "fs";
import path from "path";
import { diffordsTimeoutMs, fetchWithTimeout } from "@/lib/recipes/fetch-with-timeout";
import { parseDiffordsRecipePage } from "@/lib/diffords/parse-recipe-page";
import type { DiffordsRecipe } from "@/lib/diffords/types";
import { extractDiffordsIdFromUrl } from "@/lib/diffords/ids";
import { isUrlAllowed } from "@/lib/scrape/robots";

export const DIFFORDS_USER_AGENT = "ElTraviesoBot/1.0 (+auditoria-recetas-interna)";
const RATE_MS = Number(process.env.RATE_MS ?? 2000);
const CACHE_DIR = path.resolve(process.cwd(), ".scrape-cache", "diffords");
const ORIGIN = "https://www.diffordsguide.com";

let lastFetchAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cachePathForUrl(url: string): string {
  const id = extractDiffordsIdFromUrl(url) ?? url.replace(/[^\w-]+/g, "_");
  return path.join(CACHE_DIR, `${id}.html`);
}

async function throttle() {
  const elapsed = Date.now() - lastFetchAt;
  if (elapsed < RATE_MS) {
    await sleep(RATE_MS - elapsed);
  }
  lastFetchAt = Date.now();
}

async function fetchHtml(
  url: string,
  forceFetch = false,
  maxAttempts = 3,
): Promise<string> {
  const allowed = await isUrlAllowed(url, DIFFORDS_USER_AGENT);
  if (!allowed) {
    throw new Error(`URL bloqueada por robots.txt: ${url}`);
  }

  const cacheFile = cachePathForUrl(url);
  if (!forceFetch && fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile, "utf8");
  }

  await throttle();

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const res = await fetchWithTimeout(
        url,
        {
          headers: {
            "User-Agent": DIFFORDS_USER_AGENT,
            Accept: "text/html,application/xhtml+xml",
          },
        },
        diffordsTimeoutMs(),
      );

      if (res.status === 429 || res.status === 503) {
        await sleep(RATE_MS * (attempt + 2));
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} al obtener ${url}`);
      }

      const html = await res.text();
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(cacheFile, html, "utf8");
      return html;
    } catch (error) {
      lastError = error;
      await sleep(RATE_MS);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/** HTML en caché o remoto (robots + throttle). Reutilizable para extraer og:image. */
export async function fetchDiffordsHtml(
  sourceUrl: string,
  forceFetch = false,
  maxAttempts = 3,
): Promise<string> {
  const normalized = sourceUrl.startsWith("http") ? sourceUrl : `${ORIGIN}${sourceUrl}`;
  return fetchHtml(normalized, forceFetch, maxAttempts);
}

export async function fetchDiffordsRecipe(
  sourceUrl: string,
  options?: { forceFetch?: boolean },
): Promise<DiffordsRecipe> {
  const normalized = sourceUrl.startsWith("http") ? sourceUrl : `${ORIGIN}${sourceUrl}`;
  const html = await fetchHtml(normalized, options?.forceFetch ?? false);
  return parseDiffordsRecipePage(html, normalized);
}

export function clearDiffordsCache(sourceUrl: string) {
  const cacheFile = cachePathForUrl(sourceUrl);
  if (fs.existsSync(cacheFile)) {
    fs.unlinkSync(cacheFile);
  }
}
