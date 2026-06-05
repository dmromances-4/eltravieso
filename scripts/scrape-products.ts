// ─────────────────────────────────────────────────────────────────────────────
// FASE B — Scraper de productos de webs de coctelería/hostelería.
// Independiente de la demo (requiere red). Toma URLs semilla de la columna
// "Enlace Web" de Productos/*.csv (+ TARGET_SEEDS), respeta robots.txt, limita
// el ritmo, cachea en .scrape-cache/ y NORMALIZA al MISMO formato de
// data/products.json (NormalizedProduct), fusionando por slug sin sobrescribir.
//
// Uso:
//   npx tsx scripts/scrape-products.ts            # usa semillas de los CSV
//   npx tsx scripts/scrape-products.ts <url> ...  # scrapea URLs concretas
//   MAX_URLS=50 RATE_MS=1500 npx tsx scripts/scrape-products.ts
//
// Nota legal: respeta robots.txt y los Términos de Servicio de cada web. Úsalo
// solo sobre webs que permitan el scraping. Pensado para catalogación interna.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "fs";
import path from "path";
import { URL } from "url";
import csvParser from "csv-parser";
import type { NormalizedProduct } from "./build-products";

const USER_AGENT = "ElTraviesoBot/1.0 (+catalogacion-interna)";
const RATE_MS = Number(process.env.RATE_MS ?? 1500);
const MAX_URLS = Number(process.env.MAX_URLS ?? 40);
const CACHE_DIR = path.resolve(process.cwd(), ".scrape-cache");
const PRODUCTOS_DIR = path.resolve(process.cwd(), "Productos");
const OUTPUT = path.resolve(process.cwd(), "data", "products.json");

// Tiendas objetivo de ejemplo (rellenar con secciones de catálogo reales).
const TARGET_SEEDS: string[] = [
  // "https://tienda-cocteleria.example/cristaleria",
  // "https://material-hosteleria.example/coctelera",
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePriceCents(raw: string | number | undefined | null): number {
  if (raw == null) return 0;
  let s = String(raw).replace(/€|\s|EUR|\$|USD/gi, "").trim();
  if (!s) return 0;
  if (s.includes(".") && s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const v = parseFloat(s);
  return Number.isFinite(v) && v > 0 ? Math.round(v * 100) : 0;
}

function categoryFromText(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("vermut") || t.includes("vermouth")) return "VERMUT";
  if (t.includes("sirope") || t.includes("syrup") || t.includes("jarabe")) return "SIROPE";
  if (t.includes("soda") || t.includes("tonica") || t.includes("tónica") || t.includes("refresco")) return "SODA";
  if (t.includes("vaso") || t.includes("copa") || t.includes("cristal") || t.includes("coctelera") || t.includes("glass")) return "CRISTALERIA";
  if (t.includes("camiseta") || t.includes("delantal") || t.includes("ropa") || t.includes("textil")) return "ROPA";
  if (t.includes("jigger") || t.includes("cuchar") || t.includes("colador") || t.includes("kit") || t.includes("herramienta") || t.includes("material")) return "MATERIAL";
  if (t.includes("gin") || t.includes("ron") || t.includes("whisky") || t.includes("vodka") || t.includes("licor") || t.includes("vino")) return "ALCOHOL";
  return "MATERIAL";
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── robots.txt (mínimo): cache por host, comprueba Disallow para nuestra ruta ──
const robotsCache = new Map<string, string[]>(); // host -> disallow paths

async function getDisallows(origin: string): Promise<string[]> {
  if (robotsCache.has(origin)) return robotsCache.get(origin)!;
  const disallows: string[] = [];
  try {
    const res = await fetch(`${origin}/robots.txt`, { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) {
      const text = await res.text();
      let appliesToUs = true; // por defecto consideramos el bloque "*"
      for (const line of text.split(/\r?\n/)) {
        const l = line.trim();
        if (/^user-agent:/i.test(l)) {
          const ua = l.split(":")[1]?.trim() ?? "*";
          appliesToUs = ua === "*" || USER_AGENT.toLowerCase().includes(ua.toLowerCase());
        } else if (appliesToUs && /^disallow:/i.test(l)) {
          const p = l.split(":").slice(1).join(":").trim();
          if (p) disallows.push(p);
        }
      }
    }
  } catch {
    // sin robots.txt accesible: permitimos por defecto.
  }
  robotsCache.set(origin, disallows);
  return disallows;
}

async function isAllowed(target: string): Promise<boolean> {
  try {
    const u = new URL(target);
    const disallows = await getDisallows(u.origin);
    return !disallows.some((d) => d !== "/" && u.pathname.startsWith(d)) && !disallows.includes("/");
  } catch {
    return false;
  }
}

// ── Fetch con cache en disco ───────────────────────────────────────────────────
async function fetchCached(target: string): Promise<string | null> {
  ensureDir(CACHE_DIR);
  const key = slugify(target).slice(0, 120) || "page";
  const cacheFile = path.join(CACHE_DIR, `${key}.html`);
  if (fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile, "utf-8");

  try {
    const res = await fetch(target, { headers: { "User-Agent": USER_AGENT, Accept: "text/html" } });
    if (!res.ok) return null;
    const html = await res.text();
    fs.writeFileSync(cacheFile, html, "utf-8");
    await sleep(RATE_MS); // rate-limit tras cada descarga real
    return html;
  } catch (err) {
    console.warn(`  fetch falló: ${target}`, (err as Error).message);
    return null;
  }
}

// ── Extracción: JSON-LD schema.org/Product + fallback OpenGraph ────────────────
function extractJsonLdProducts(html: string): any[] {
  const out: any[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const json = JSON.parse(m[1].trim());
      const nodes = Array.isArray(json) ? json : json["@graph"] ? json["@graph"] : [json];
      for (const node of nodes) {
        const type = node?.["@type"];
        const isProduct = type === "Product" || (Array.isArray(type) && type.includes("Product"));
        if (isProduct) out.push(node);
      }
    } catch {
      // JSON-LD inválido, ignorar.
    }
  }
  return out;
}

function metaContent(html: string, property: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i");
  return html.match(re)?.[1] ?? null;
}

function firstString(value: any): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return firstString(value[0]);
  if (typeof value === "object") return firstString(value.url ?? value.name ?? value["@id"]);
  return null;
}

function toProduct(node: any, html: string, sourceUrl: string): NormalizedProduct | null {
  const title = (node?.name ?? metaContent(html, "og:title") ?? "").toString().trim();
  if (!title) return null;

  const offers = Array.isArray(node?.offers) ? node.offers[0] : node?.offers;
  const priceRaw = offers?.price ?? offers?.lowPrice ?? metaContent(html, "product:price:amount");
  const image = firstString(node?.image) ?? metaContent(html, "og:image");
  const desc = (node?.description ?? metaContent(html, "og:description") ?? "").toString().slice(0, 600).trim();
  const category = categoryFromText(`${title} ${desc} ${node?.category ?? ""}`);

  return {
    title,
    slug: slugify(title),
    description: desc || null,
    category,
    priceCents: parsePriceCents(priceRaw),
    imageUrl: image && /^https?:\/\//i.test(image) ? image : null,
    sourceUrl,
    format: "UNIT",
    volumeMl: null,
  };
}

// ── Semillas desde Productos/*.csv (columna Enlace Web) ────────────────────────
function readCsv(file: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    fs.createReadStream(file)
      .pipe(csvParser({ separator: ";" }))
      .on("data", (r) => rows.push(r))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

async function collectSeedUrls(): Promise<string[]> {
  const urls = new Set<string>(TARGET_SEEDS);
  const argUrls = process.argv.slice(2).filter((a) => /^https?:\/\//i.test(a));
  argUrls.forEach((u) => urls.add(u));

  if (argUrls.length === 0 && fs.existsSync(PRODUCTOS_DIR)) {
    for (const f of fs.readdirSync(PRODUCTOS_DIR)) {
      if (!f.endsWith(".csv")) continue;
      const rows = await readCsv(path.join(PRODUCTOS_DIR, f)).catch(() => []);
      for (const row of rows) {
        for (const key of Object.keys(row)) {
          if (/enlace/i.test(key) && /^https?:\/\//i.test(row[key]?.trim() ?? "")) {
            urls.add(row[key].trim());
          }
        }
      }
    }
  }
  return [...urls].slice(0, MAX_URLS);
}

function loadExisting(): NormalizedProduct[] {
  try {
    return JSON.parse(fs.readFileSync(OUTPUT, "utf-8")) as NormalizedProduct[];
  } catch {
    return [];
  }
}

async function main() {
  const seeds = await collectSeedUrls();
  console.log(`🔎 ${seeds.length} URLs semilla (límite ${MAX_URLS}, rate ${RATE_MS}ms).`);
  if (seeds.length === 0) {
    console.log("No hay URLs semilla. Añade TARGET_SEEDS o pásalas como argumentos.");
    return;
  }

  const existing = loadExisting();
  const bySlug = new Map(existing.map((p) => [p.slug, p]));
  let scraped = 0;
  let added = 0;

  for (const url of seeds) {
    if (!(await isAllowed(url))) {
      console.log(`  ⛔ robots.txt no permite: ${url}`);
      continue;
    }
    const html = await fetchCached(url);
    if (!html) continue;
    scraped++;

    const nodes = extractJsonLdProducts(html);
    const candidates = nodes.length ? nodes : [null]; // fallback OG si no hay JSON-LD
    for (const node of candidates) {
      const product = toProduct(node ?? {}, html, url);
      if (!product || !product.slug) continue;
      if (!bySlug.has(product.slug)) {
        bySlug.set(product.slug, product);
        added++;
      }
    }
  }

  const merged = [...bySlug.values()];
  fs.writeFileSync(OUTPUT, JSON.stringify(merged, null, 2), "utf-8");
  console.log(`✓ Scrapeadas ${scraped} páginas. Nuevos productos: ${added}. Total catálogo: ${merged.length}.`);
  console.log("  Reseed para reflejarlo en la tienda:  npm run db:setup");
}

main().catch((err) => {
  console.error("Error en el scraper:", err);
  process.exit(1);
});
