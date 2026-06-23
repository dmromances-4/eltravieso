#!/usr/bin/env tsx
// ─────────────────────────────────────────────────────────────────────────────
// Importación masiva de destilados desde retailers de referencia.
//
// Fuentes soportadas:
//   vilaviniteca, lafuente          → scraping directo (sitemap/categorías)
//   decantalo, bodeboca             → Cloudflare; usar --urls o caché local
//   import-destilados               → definir SPIRITS_IMPORT_DESTILADOS_URL + SEEDS
//
// Uso:
//   npm run import:spirits -- --source vilaviniteca --limit 30 --dry-run
//   npm run import:spirits -- --source lafuente --limit 50 --merge
//   npm run import:spirits -- --source all --limit 20 --merge
//   npm run import:spirits -- --urls https://www.decantalo.com/es/es/foo.html --merge
//
// Variables: RATE_MS (default 1500), MAX_PAGES_PER_CATEGORY (default 3)
// ─────────────────────────────────────────────────────────────────────────────

import fs from "fs";
import path from "path";
import {
  SPIRITS_RETAILERS,
  discoverProductUrlsFromHtml,
  isSpiritProductPage,
  mergeSpiritCatalog,
  parseSpiritFromHtml,
  type ImportedSpirit,
  type SpiritsRetailerId,
} from "@/lib/products/spirits-import";
import { mergeSpiritRecords } from "@/lib/alcohol/spirit-id";
import type { AlcoholRecord } from "@/types/alcohol";

const USER_AGENT = "ElTraviesoBot/1.0 (+catalogacion-interna; contacto@eltravieso.local)";
const RATE_MS = Number(process.env.RATE_MS ?? 1500);
const MAX_PAGES_PER_CATEGORY = Number(process.env.MAX_PAGES_PER_CATEGORY ?? 3);
const CHECKPOINT_EVERY = Number(process.env.SPIRITS_CHECKPOINT_EVERY ?? 100);
const CACHE_DIR = path.resolve(process.cwd(), ".scrape-cache", "spirits");
const OUTPUT = path.resolve(process.cwd(), "data", "spirits-import.json");
const PRODUCTS_OUTPUT = path.resolve(process.cwd(), "data", "products.json");
const ENCYCLOPEDIA_OUTPUT = path.resolve(process.cwd(), "data", "alcohol-encyclopedia.json");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function parseArgs(argv: string[]) {
  const sources: SpiritsRetailerId[] = [];
  const urls: string[] = [];
  let limit = Number(process.env.SPIRITS_IMPORT_LIMIT ?? 100);
  let dryRun = false;
  let merge = false;
  let overwrite = false;
  let output = OUTPUT;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--merge") merge = true;
    else if (arg === "--overwrite") overwrite = true;
    else if (arg === "--limit" && argv[i + 1]) limit = Number(argv[++i]);
    else if (arg === "--output" && argv[i + 1]) output = path.resolve(argv[++i]);
    else if (arg === "--source" && argv[i + 1]) {
      const raw = argv[++i];
      if (raw === "all") {
        sources.push(...(Object.keys(SPIRITS_RETAILERS) as SpiritsRetailerId[]));
      } else {
        for (const part of raw.split(",")) {
          const id = part.trim() as SpiritsRetailerId;
          if (SPIRITS_RETAILERS[id]) sources.push(id);
          else console.warn(`  ⚠ Fuente desconocida: ${part}`);
        }
      }
    } else if (arg === "--urls") {
      while (argv[i + 1] && !argv[i + 1].startsWith("--")) urls.push(argv[++i]);
    } else if (/^https?:\/\//i.test(arg)) {
      urls.push(arg);
    }
  }

  return {
    sources: [...new Set(sources)],
    urls,
    limit,
    dryRun,
    merge,
    overwrite,
    output,
  };
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
    // allow by default
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

async function fetchCached(target: string, force = false): Promise<{ html: string | null; blocked: boolean }> {
  ensureDir(CACHE_DIR);
  const key = target.replace(/[^a-z0-9]+/gi, "-").slice(0, 140);
  const cacheFile = path.join(CACHE_DIR, `${key}.html`);

  if (!force && fs.existsSync(cacheFile)) {
    return { html: fs.readFileSync(cacheFile, "utf-8"), blocked: false };
  }

  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-ES,es;q=0.9",
      },
    });
    if (res.status === 403 || res.status === 503) {
      return { html: null, blocked: true };
    }
    if (!res.ok) return { html: null, blocked: false };
    const html = await res.text();
    if (/cloudflare|attention required|you have been blocked/i.test(html) && html.length < 20_000) {
      return { html: null, blocked: true };
    }
    fs.writeFileSync(cacheFile, html, "utf-8");
    await sleep(RATE_MS);
    return { html, blocked: false };
  } catch (err) {
    console.warn(`  fetch falló: ${target}`, (err as Error).message);
    return { html: null, blocked: false };
  }
}

function discoverPaginationUrls(html: string, pageUrl: string): string[] {
  const urls = new Set<string>();
  const base = new URL(pageUrl);
  const patterns = [
    /href="([^"]+\?p=\d+)"/gi,
    /href="([^"]+\?page=\d+)"/gi,
    /href="([^"]+\/page\/\d+\/?)"/gi,
  ];
  for (const re of patterns) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      try {
        urls.add(new URL(m[1], base).href.split("#")[0]);
      } catch {
        // ignore bad URLs
      }
    }
  }
  return [...urls].slice(0, MAX_PAGES_PER_CATEGORY);
}

async function discoverUrlsForSource(sourceId: SpiritsRetailerId, maxUrls: number): Promise<string[]> {
  const source = SPIRITS_RETAILERS[sourceId];
  if (source.fetchBlocked && source.categorySeeds.length === 0) {
    console.log(`  ⏭ ${source.label}: bloqueado o sin semillas (configura env o --urls).`);
    return [];
  }

  const discovered = new Set<string>();

  for (const seed of source.categorySeeds) {
    if (discovered.size >= maxUrls) break;
    const pages = [seed];
    const seenPages = new Set<string>();

    while (pages.length > 0 && discovered.size < maxUrls) {
      const pageUrl = pages.shift()!;
      if (seenPages.has(pageUrl)) continue;
      seenPages.add(pageUrl);

      if (!(await isAllowed(pageUrl))) {
        console.log(`  ⛔ robots.txt: ${pageUrl}`);
        continue;
      }

      const { html, blocked } = await fetchCached(pageUrl);
      if (blocked) {
        console.log(`  🚫 Cloudflare/bloqueo en ${source.label} (${pageUrl}). Usa --urls con caché manual.`);
        break;
      }
      if (!html) continue;

      for (const url of discoverProductUrlsFromHtml(html, pageUrl, source)) {
        discovered.add(url);
        if (discovered.size >= maxUrls) break;
      }

      if (seenPages.size < MAX_PAGES_PER_CATEGORY) {
        for (const next of discoverPaginationUrls(html, pageUrl)) {
          if (!seenPages.has(next)) pages.push(next);
        }
      }
    }
  }

  return [...discovered].slice(0, maxUrls);
}

async function importFromUrls(
  urls: string[],
  retailerId: SpiritsRetailerId | "manual",
  limit: number,
  onCheckpoint?: (batch: ImportedSpirit[]) => void,
): Promise<ImportedSpirit[]> {
  const results: ImportedSpirit[] = [];
  let sinceCheckpoint = 0;
  const retailer =
    retailerId === "manual"
      ? SPIRITS_RETAILERS.decantalo
      : SPIRITS_RETAILERS[retailerId];

  for (const url of urls) {
    if (results.length >= limit) break;
    if (!(await isAllowed(url))) {
      console.log(`  ⛔ robots.txt: ${url}`);
      continue;
    }
    const { html, blocked } = await fetchCached(url);
    if (blocked) {
      console.log(`  🚫 Bloqueado: ${url}`);
      continue;
    }
    if (!html) continue;

    const inferredRetailer = inferRetailerFromUrl(url) ?? retailer;
    const retailerKey = (inferRetailerFromUrl(url)?.id ?? retailerId) as SpiritsRetailerId;
    if (retailerId !== "manual" && !isSpiritProductPage(html, retailerKey)) {
      console.log(`  ⊘ Omitido (no destilado): ${url}`);
      continue;
    }
    const product = parseSpiritFromHtml(html, url, inferredRetailer);
    if (!product?.slug) continue;
    if (product.priceCents <= 0 && !product.description) continue;

    results.push(product);
    sinceCheckpoint += 1;
    if (onCheckpoint && sinceCheckpoint >= CHECKPOINT_EVERY) {
      onCheckpoint(results.slice(-sinceCheckpoint));
      sinceCheckpoint = 0;
    }
    console.log(
      `  ✓ ${product.title} — ${(product.priceCents / 100).toFixed(2)}€` +
        (product.metadata?.spiritType ? ` [${product.metadata.spiritType}]` : "")
    );
  }
  if (onCheckpoint && sinceCheckpoint > 0) {
    onCheckpoint(results.slice(-sinceCheckpoint));
  }
  return results;
}

function inferRetailerFromUrl(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("vilaviniteca")) return SPIRITS_RETAILERS.vilaviniteca;
    if (host.includes("lafuente")) return SPIRITS_RETAILERS.lafuente;
    if (host.includes("decantalo")) return SPIRITS_RETAILERS.decantalo;
    if (host.includes("bodeboca")) return SPIRITS_RETAILERS.bodeboca;
  } catch {
    return null;
  }
  return null;
}

function loadJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function collectDecantaloBodebocaUrlsFromCatalog(limit: number): string[] {
  const products = loadJson<ImportedSpirit[]>(PRODUCTS_OUTPUT, []);
  const urls: string[] = [];
  for (const p of products) {
    if (!p.sourceUrl) continue;
    if (/decantalo|bodeboca/i.test(p.sourceUrl) && /\.html|\/vino\//i.test(p.sourceUrl)) {
      urls.push(p.sourceUrl);
    }
    if (urls.length >= limit) break;
  }
  return urls;
}

function writeJsonAtomic(file: string, data: unknown): void {
  const dir = path.dirname(file);
  ensureDir(dir);
  const tmp = path.join(dir, `.${path.basename(file)}.${process.pid}.tmp`);
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  let lastError: unknown;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      fs.writeFileSync(tmp, payload, "utf-8");
      if (fs.existsSync(file)) fs.rmSync(file, { force: true });
      fs.renameSync(tmp, file);
      return;
    } catch (err) {
      lastError = err;
      try {
        if (fs.existsSync(tmp)) fs.rmSync(tmp, { force: true });
      } catch {
        // ignore cleanup errors
      }
      const waitMs = 500 * (attempt + 1);
      const start = Date.now();
      while (Date.now() - start < waitMs) {
        // brief pause before retry (OneDrive lock)
      }
    }
  }
  throw lastError;
}

function persistSpiritsBatch(
  output: string,
  batch: ImportedSpirit[],
  overwrite: boolean,
): { merged: ImportedSpirit[]; added: number; updated: number } {
  const existing = loadJson<ImportedSpirit[]>(output, []);
  const result = mergeSpiritCatalog(existing, batch, { overwrite });
  writeJsonAtomic(output, result.merged);
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(
    `🥃 Import destilados — límite ${args.limit}, rate ${RATE_MS}ms` +
      (args.dryRun ? " [dry-run]" : "")
  );

  const imported: ImportedSpirit[] = [];
  let checkpointAdded = 0;
  let checkpointUpdated = 0;

  const checkpoint =
    args.dryRun
      ? undefined
      : (batch: ImportedSpirit[]) => {
          const { merged, added, updated } = persistSpiritsBatch(args.output, batch, args.overwrite);
          checkpointAdded += added;
          checkpointUpdated += updated;
          console.log(`  💾 checkpoint → ${merged.length} refs (+${added} nuevas)`);
        };

  if (args.urls.length > 0) {
    console.log(`\n📎 ${args.urls.length} URLs manuales`);
    imported.push(...(await importFromUrls(args.urls, "manual", args.limit, checkpoint)));
  }

  for (const sourceId of args.sources) {
    if (imported.length >= args.limit) break;
    const source = SPIRITS_RETAILERS[sourceId];
    console.log(`\n🏪 ${source.label}`);

    let urls: string[] = [];
    if (source.fetchBlocked) {
      urls = collectDecantaloBodebocaUrlsFromCatalog(args.limit);
      if (urls.length === 0) {
        console.log(
          `  ⚠ ${source.label} bloquea bots. Opciones: exportar URLs desde navegador, ` +
            `guardar HTML en .scrape-cache/spirits/, o npm run scrape:products <url>`
        );
        continue;
      }
      console.log(`  ↪ Re-importando ${urls.length} URLs ya presentes en products.json`);
    } else {
      urls = await discoverUrlsForSource(sourceId, Math.max(args.limit * 4, args.limit));
      console.log(`  🔎 ${urls.length} URLs de producto descubiertas`);
    }

    const batch = await importFromUrls(urls, sourceId, args.limit - imported.length, checkpoint);
    imported.push(...batch);
  }

  console.log(`\n📦 Total importados en esta ejecución: ${imported.length}`);
  if (imported.length === 0) {
    console.log("Nada que guardar.");
    return;
  }

  if (args.dryRun) {
    console.log("Dry-run: no se escribieron ficheros.");
    return;
  }

  if (checkpointAdded > 0) {
    const merged = loadJson<ImportedSpirit[]>(args.output, []);
    console.log(
      `✓ ${args.output} → ${merged.length} refs (+${checkpointAdded} nuevas en checkpoints, ~${checkpointUpdated} actualizadas)`,
    );
  } else {
    const { merged, added, updated } = persistSpiritsBatch(args.output, imported, args.overwrite);
    console.log(`✓ ${args.output} → ${merged.length} refs (+${added} nuevas, ~${updated} actualizadas)`);
  }

  if (args.merge) {
    const existingProducts = loadJson<ImportedSpirit[]>(PRODUCTS_OUTPUT, []);
    const productMerge = mergeSpiritCatalog(existingProducts, imported, {
      overwrite: args.overwrite,
    });
    writeJsonAtomic(PRODUCTS_OUTPUT, productMerge.merged);
    console.log(
      `✓ ${PRODUCTS_OUTPUT} → ${productMerge.merged.length} productos (+${productMerge.added} nuevos)`
    );

    const existingEncyclopedia = loadJson<AlcoholRecord[]>(ENCYCLOPEDIA_OUTPUT, []);
    const spiritsForEncyclopedia = loadJson<ImportedSpirit[]>(args.output, []);
    const encyclopediaMerge = mergeSpiritRecords(existingEncyclopedia, spiritsForEncyclopedia);
    writeJsonAtomic(ENCYCLOPEDIA_OUTPUT, encyclopediaMerge.merged);
    console.log(
      `✓ ${ENCYCLOPEDIA_OUTPUT} → ${encyclopediaMerge.merged.length} entradas ` +
        `(+${encyclopediaMerge.added} nuevas, ~${encyclopediaMerge.updated} actualizadas)`,
    );
    console.log("  Siguiente paso: npm run generate:spirit-images -- --write");
  }
}

main().catch((err) => {
  console.error("Error importando destilados:", err);
  process.exit(1);
});
