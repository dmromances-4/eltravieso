// Scraper de locales World's 50 Best (global + regional, listas 1-50).
// Respeta robots.txt, cachea en .scrape-cache/w50best/ y escribe data/venues-worlds50best.json.
//
// Uso:
//   npm run scrape:venues
//   npx tsx scripts/scrape-worlds50best.ts --bars-only
//   npx tsx scripts/scrape-worlds50best.ts --restaurants-only
//   npx tsx scripts/scrape-worlds50best.ts --detail-only
//
// Nota legal: uso interno / catalogación editorial con atribución en la UI.

import fs from "fs";
import path from "path";
import type { VenueContinent, VenueListScope, Worlds50BestCategory } from "@prisma/client";
import { isUrlAllowed } from "../lib/scrape/robots";
import { isEuropeanVenue } from "../lib/venues/continents";
import {
  applySeedContext,
  buildRanking,
  mergeVenueGuides,
} from "../lib/venues/merge-guide";
import {
  dedupeSlugs,
  parseDetailPage,
  parseListPage,
} from "../lib/venues/worlds50best-parser";
import type { NormalizedVenueGuide } from "../lib/venues/types";

const USER_AGENT = "ElTraviesoBot/1.0 (+catalogacion-interna; guia-locales)";
const RATE_MS = Number(process.env.RATE_MS ?? 1500);
const CACHE_DIR = path.resolve(process.cwd(), ".scrape-cache", "w50best");
const OUTPUT = path.resolve(process.cwd(), "data", "venues-worlds50best.json");
const BASE = "https://www.theworlds50best.com";

type Seed = {
  url: string;
  category: Worlds50BestCategory;
  base: string;
  continent: VenueContinent;
  listScope: VenueListScope;
};

const GLOBAL_SEEDS: Seed[] = [
  {
    url: `${BASE}/bars/list/1-50`,
    category: "BARS",
    base: BASE,
    continent: "GLOBAL",
    listScope: "GLOBAL",
  },
  {
    url: `${BASE}/list/1-50`,
    category: "RESTAURANTS",
    base: BASE,
    continent: "GLOBAL",
    listScope: "GLOBAL",
  },
];

const REGIONAL_SEEDS: Seed[] = [
  {
    url: `${BASE}/bars/asia/list/1-50`,
    category: "BARS",
    base: BASE,
    continent: "ASIA",
    listScope: "REGIONAL",
  },
  {
    url: `${BASE}/bars/northamerica/list/1-50`,
    category: "BARS",
    base: BASE,
    continent: "NORTH_AMERICA",
    listScope: "REGIONAL",
  },
  {
    url: `${BASE}/bars/europe/list/1-50`,
    category: "BARS",
    base: BASE,
    continent: "EUROPE",
    listScope: "REGIONAL",
  },
  {
    url: `${BASE}/asia/en/list/1-50`,
    category: "RESTAURANTS",
    base: BASE,
    continent: "ASIA",
    listScope: "REGIONAL",
  },
  {
    url: `${BASE}/latinamerica/en/list/1-50`,
    category: "RESTAURANTS",
    base: BASE,
    continent: "LATIN_AMERICA",
    listScope: "REGIONAL",
  },
  {
    url: `${BASE}/northamerica/en/list/1-50`,
    category: "RESTAURANTS",
    base: BASE,
    continent: "NORTH_AMERICA",
    listScope: "REGIONAL",
  },
];

const SEEDS = [...GLOBAL_SEEDS, ...REGIONAL_SEEDS];

const args = new Set(process.argv.slice(2));
const barsOnly = args.has("--bars-only");
const restaurantsOnly = args.has("--restaurants-only");
const detailOnly = args.has("--detail-only");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cacheKey(url: string): string {
  return url.replace(/[^a-z0-9]+/gi, "_").slice(0, 140);
}

async function fetchCached(url: string): Promise<string | null> {
  const allowed = await isUrlAllowed(url, USER_AGENT);
  if (!allowed) {
    console.warn(`  robots.txt bloquea: ${url}`);
    return null;
  }

  ensureDir(CACHE_DIR);
  const file = path.join(CACHE_DIR, `${cacheKey(url)}.html`);
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf-8");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    });
    if (!res.ok) {
      console.warn(`  HTTP ${res.status}: ${url}`);
      return null;
    }
    const html = await res.text();
    fs.writeFileSync(file, html, "utf-8");
    await sleep(RATE_MS);
    return html;
  } catch (err) {
    console.warn(`  fetch falló: ${url}`, (err as Error).message);
    return null;
  }
}

function loadExisting(): NormalizedVenueGuide[] {
  try {
    return JSON.parse(fs.readFileSync(OUTPUT, "utf-8")) as NormalizedVenueGuide[];
  } catch {
    return [];
  }
}

function deriveEuropeBarsFromGlobal(
  bySource: Map<string, NormalizedVenueGuide>,
): number {
  const europeUrl = `${BASE}/bars/europe/list/1-50`;
  const europeanBars = [...bySource.values()]
    .filter(
      (v) =>
        v.worlds50bestCategory === "BARS" &&
        isEuropeanVenue(v.country, v.city),
    )
    .sort((a, b) => a.worlds50bestRank - b.worlds50bestRank)
    .slice(0, 50);

  let derived = 0;
  europeanBars.forEach((bar, idx) => {
    const rank = idx + 1;
    const incoming: NormalizedVenueGuide = {
      ...bar,
      continent: "EUROPE",
      listScope: "REGIONAL",
      regionalRank: rank,
      enrichmentSource: "derived",
      additionalRankings: [
        buildRanking("REGIONAL", "EUROPE", "BARS", rank, europeUrl),
      ],
    };
    const merged = mergeVenueGuides(bySource.get(bar.sourceUrl), incoming);
    bySource.set(bar.sourceUrl, merged);
    derived += 1;
  });

  return derived;
}

async function scrapeSeed(seed: Seed): Promise<NormalizedVenueGuide[]> {
  const listFile = path.join(CACHE_DIR, `${cacheKey(seed.url)}.html`);
  let listHtml: string | null = null;

  if (detailOnly && fs.existsSync(listFile)) {
    listHtml = fs.readFileSync(listFile, "utf-8");
  } else {
    listHtml = await fetchCached(seed.url);
  }

  if (!listHtml) return [];

  const items = parseListPage(listHtml, seed.base, { maxRank: 50 });
  console.log(`  ${seed.continent} ${seed.category}: ${items.length} entradas`);

  if (items.length === 0 && seed.continent === "EUROPE" && seed.category === "BARS") {
    console.log("  Europe bars vacío — se aplicará derivación tras merge global");
    return [];
  }

  const venues: NormalizedVenueGuide[] = [];

  for (const item of items) {
    const detailUrl = item.detailPath.startsWith("http")
      ? item.detailPath
      : `${seed.base}${item.detailPath.startsWith("/") ? "" : "/"}${item.detailPath}`;

    const detailHtml = await fetchCached(detailUrl);
    if (!detailHtml) continue;

    const parsed = parseDetailPage(detailHtml, item, seed.category, seed.base);
    venues.push(applySeedContext(parsed, seed));
  }

  return venues;
}

async function main() {
  const seeds = SEEDS.filter((s) => {
    if (barsOnly) return s.category === "BARS";
    if (restaurantsOnly) return s.category === "RESTAURANTS";
    return true;
  });

  console.log(`🔎 Scrape World's 50 Best (${seeds.length} listas)`);

  const existing = detailOnly ? loadExisting() : [];
  const bySource = new Map(existing.map((v) => [v.sourceUrl, v]));

  let mergedCount = 0;

  for (const seed of seeds) {
    const batch = await scrapeSeed(seed);
    for (const venue of batch) {
      const prev = bySource.get(venue.sourceUrl);
      bySource.set(venue.sourceUrl, mergeVenueGuides(prev, venue));
      if (prev) mergedCount += 1;
    }
  }

  const europeSeed = seeds.find((s) => s.continent === "EUROPE" && s.category === "BARS");
  if (europeSeed) {
    const listFile = path.join(CACHE_DIR, `${cacheKey(europeSeed.url)}.html`);
    const europeHtml = fs.existsSync(listFile) ? fs.readFileSync(listFile, "utf-8") : "";
    const europeItems = europeHtml ? parseListPage(europeHtml, europeSeed.base, { maxRank: 50 }) : [];
    if (europeItems.length === 0) {
      const derived = deriveEuropeBarsFromGlobal(bySource);
      console.log(`  Europe bars derivados desde global: ${derived}`);
    }
  }

  const merged = dedupeSlugs([...bySource.values()]);
  ensureDir(path.dirname(OUTPUT));
  fs.writeFileSync(OUTPUT, JSON.stringify(merged, null, 2), "utf-8");

  console.log(
    `✓ ${merged.length} locales en ${OUTPUT} (${mergedCount} merges por sourceUrl)`,
  );
  console.log("  Importar a DB: npm run seed:venues");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
