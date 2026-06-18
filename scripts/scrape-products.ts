// ─────────────────────────────────────────────────────────────────────────────
// FASE B — Scraper de productos de webs de coctelería/hostelería.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "fs";
import path from "path";
import { URL } from "url";
import csvParser from "csv-parser";
import type { SyncPhaseResult } from "@/lib/catalog/sync-report";
import { pathToFileURL } from "url";
import {
  loadProductsJson,
  PRODUCTS_OUTPUT,
  type NormalizedProduct,
} from "./build-products";

const USER_AGENT = "ElTraviesoBot/1.0 (+catalogacion-interna)";
const CACHE_DIR = path.resolve(process.cwd(), ".scrape-cache");
const PRODUCTOS_DIR = path.resolve(process.cwd(), "Productos");

const TARGET_SEEDS: string[] = [];

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

const robotsCache = new Map<string, string[]>();

async function getDisallows(origin: string): Promise<string[]> {
  if (robotsCache.has(origin)) return robotsCache.get(origin)!;
  const disallows: string[] = [];
  try {
    const res = await fetch(`${origin}/robots.txt`, { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) {
      const text = await res.text();
      let appliesToUs = true;
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
    // sin robots.txt accesible
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

async function fetchCached(target: string, rateMs: number): Promise<string | null> {
  ensureDir(CACHE_DIR);
  const key = slugify(target).slice(0, 120) || "page";
  const cacheFile = path.join(CACHE_DIR, `${key}.html`);
  if (fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile, "utf-8");

  try {
    const res = await fetch(target, { headers: { "User-Agent": USER_AGENT, Accept: "text/html" } });
    if (!res.ok) return null;
    const html = await res.text();
    fs.writeFileSync(cacheFile, html, "utf-8");
    await new Promise((r) => setTimeout(r, rateMs));
    return html;
  } catch (err) {
    console.warn(`  fetch falló: ${target}`, (err as Error).message);
    return null;
  }
}

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
      // JSON-LD inválido
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

export async function collectProductSeedUrls(options?: {
  maxUrls?: number;
  extraUrls?: string[];
}): Promise<string[]> {
  const maxUrls = options?.maxUrls ?? Number(process.env.MAX_URLS ?? 40);
  const urls = new Set<string>([...TARGET_SEEDS, ...(options?.extraUrls ?? [])]);
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
  return [...urls].slice(0, maxUrls);
}

export type ProductScrapeOptions = {
  dryRun?: boolean;
  maxUrls?: number;
  rateMs?: number;
  extraUrls?: string[];
  outputPath?: string;
  existing?: NormalizedProduct[];
};

export async function runProductScrape(options: ProductScrapeOptions = {}): Promise<{
  phase: SyncPhaseResult;
  products: NormalizedProduct[];
}> {
  const rateMs = options.rateMs ?? Number(process.env.RATE_MS ?? 1500);
  const outputPath = options.outputPath ?? PRODUCTS_OUTPUT;
  const seeds = await collectProductSeedUrls({ maxUrls: options.maxUrls, extraUrls: options.extraUrls });

  if (seeds.length === 0) {
    return {
      phase: { added: 0, skipped: 0, total: 0, errors: 0, notes: ["No hay URLs semilla"] },
      products: options.existing ?? loadProductsJson(outputPath),
    };
  }

  const existing = options.existing ?? loadProductsJson(outputPath);
  const bySlug = new Map(existing.map((p) => [p.slug, p]));
  let scraped = 0;
  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const url of seeds) {
    if (!(await isAllowed(url))) {
      console.log(`  ⛔ robots.txt no permite: ${url}`);
      errors += 1;
      continue;
    }
    const html = await fetchCached(url, rateMs);
    if (!html) {
      errors += 1;
      continue;
    }
    scraped++;

    const nodes = extractJsonLdProducts(html);
    const candidates = nodes.length ? nodes : [null];
    for (const node of candidates) {
      const product = toProduct(node ?? {}, html, url);
      if (!product || !product.slug) continue;
      if (!bySlug.has(product.slug)) {
        bySlug.set(product.slug, product);
        added++;
      } else {
        skipped += 1;
      }
    }
  }

  const merged = [...bySlug.values()];
  if (!options.dryRun) {
    fs.writeFileSync(outputPath, `${JSON.stringify(merged, null, 2)}\n`, "utf-8");
  }

  console.log(`✓ Scrapeadas ${scraped} páginas. Nuevos productos: ${added}. Total catálogo: ${merged.length}.`);
  return {
    phase: {
      added,
      skipped,
      total: merged.length,
      errors,
      notes: [`scraped=${scraped}`],
    },
    products: merged,
  };
}

async function main() {
  const seeds = await collectProductSeedUrls();
  const rateMs = Number(process.env.RATE_MS ?? 1500);
  const maxUrls = Number(process.env.MAX_URLS ?? 40);
  console.log(`🔎 ${seeds.length} URLs semilla (límite ${maxUrls}, rate ${rateMs}ms).`);
  if (seeds.length === 0) {
    console.log("No hay URLs semilla. Añade TARGET_SEEDS o pásalas como argumentos.");
    return;
  }
  await runProductScrape();
}

const isDirectRun = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isDirectRun) {
  main().catch((err) => {
    console.error("Error en el scraper:", err);
    process.exit(1);
  });
}
