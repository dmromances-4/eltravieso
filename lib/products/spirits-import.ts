/**
 * Importación de destilados desde retailers de referencia (catálogo interno).
 * Extrae JSON-LD schema.org/Product + metadatos enriquecidos.
 */

import type { NormalizedProduct, ProductImportMetadata } from "@/scripts/build-products";

export type SpiritsRetailerId =
  | "vilaviniteca"
  | "lafuente"
  | "decantalo"
  | "bodeboca"
  | "import-destilados";

export interface SpiritsRetailerSource {
  id: SpiritsRetailerId;
  label: string;
  origin: string;
  /** Si true, el fetch automatizado suele fallar (Cloudflare); usar --urls o caché. */
  fetchBlocked?: boolean;
  categorySeeds: string[];
  productLinkRe: RegExp;
  normalizeProductUrl: (href: string, pageUrl: string) => string | null;
}

export interface ImportedSpirit extends NormalizedProduct {
  metadata?: ProductImportMetadata;
}

export const SPIRITS_RETAILERS: Record<SpiritsRetailerId, SpiritsRetailerSource> = {
  vilaviniteca: {
    id: "vilaviniteca",
    label: "Vila Viniteca",
    origin: "https://www.vilaviniteca.es",
    categorySeeds: [
      "https://www.vilaviniteca.es/es/destilados/tipo/ginebra.html",
      "https://www.vilaviniteca.es/es/destilados/tipo/ron.html",
      "https://www.vilaviniteca.es/es/destilados/tipo/vodka.html",
      "https://www.vilaviniteca.es/es/destilados/tipo/tequila.html",
      "https://www.vilaviniteca.es/es/destilados/tipo/mezcal.html",
      "https://www.vilaviniteca.es/es/destilados/tipo/whisky.html",
      "https://www.vilaviniteca.es/es/destilados/tipo/brandy.html",
      "https://www.vilaviniteca.es/es/destilados/tipo/cognac.html",
      "https://www.vilaviniteca.es/es/destilados/tipo/grappa.html",
      "https://www.vilaviniteca.es/es/destilados/tipo/licores.html",
      "https://www.vilaviniteca.es/es/destilados/mixology/bitters.html",
      "https://www.vilaviniteca.es/es/otras-bebidas/tipo/vermut.html",
    ],
    productLinkRe: /href="(https:\/\/www\.vilaviniteca\.es\/es\/[^"?#]+\.html)"/gi,
    normalizeProductUrl: (href) => href,
  },
  lafuente: {
    id: "lafuente",
    label: "Lafuente",
    origin: "https://lafuente.es",
    categorySeeds: [
      "https://lafuente.es/cat-prod/destilados/ginebra/",
      "https://lafuente.es/cat-prod/destilados/ron/",
      "https://lafuente.es/cat-prod/destilados/vodka/",
      "https://lafuente.es/cat-prod/destilados/whisky/",
      "https://lafuente.es/cat-prod/destilados/tequila/",
      "https://lafuente.es/cat-prod/destilados/licores/",
      "https://lafuente.es/cat-prod/destilados/vermut/",
      "https://lafuente.es/cat-prod/destilados/brandy/",
      "https://lafuente.es/cat-prod/destilados/cognac/",
    ],
    productLinkRe: /href="(https:\/\/lafuente\.es\/tienda\/[^"?#/]+\/)"/gi,
    normalizeProductUrl: (href) => href,
  },
  decantalo: {
    id: "decantalo",
    label: "Decántalo",
    origin: "https://www.decantalo.com",
    fetchBlocked: true,
    categorySeeds: [
      "https://www.decantalo.com/es/es/destilados/gin/",
      "https://www.decantalo.com/es/es/destilados/ron/",
      "https://www.decantalo.com/es/es/destilados/vodka/",
      "https://www.decantalo.com/es/es/destilados/whisky/",
      "https://www.decantalo.com/es/es/destilados/tequila/",
      "https://www.decantalo.com/es/es/destilados/licores/",
    ],
    productLinkRe: /href="(https:\/\/www\.decantalo\.com\/es\/es\/[^"?#]+\.html)"/gi,
    normalizeProductUrl: (href) => href,
  },
  bodeboca: {
    id: "bodeboca",
    label: "Bodeboca",
    origin: "https://www.bodeboca.com",
    fetchBlocked: true,
    categorySeeds: [
      "https://www.bodeboca.com/vino/gin",
      "https://www.bodeboca.com/vino/ron",
      "https://www.bodeboca.com/vino/vodka",
      "https://www.bodeboca.com/vino/whisky",
      "https://www.bodeboca.com/vino/tequila",
      "https://www.bodeboca.com/vino/licores",
      "https://www.bodeboca.com/vino/vermut",
    ],
    productLinkRe: /href="(\/vino\/[^"?#]+)"/gi,
    normalizeProductUrl: (href, pageUrl) => {
      if (href.startsWith("http")) return href;
      return new URL(href, pageUrl).href;
    },
  },
  "import-destilados": {
    id: "import-destilados",
    label: "Import de destilados",
    origin: process.env.SPIRITS_IMPORT_DESTILADOS_URL?.replace(/\/$/, "") ?? "",
    fetchBlocked: !process.env.SPIRITS_IMPORT_DESTILADOS_URL,
    categorySeeds: process.env.SPIRITS_IMPORT_DESTILADOS_SEEDS
      ? process.env.SPIRITS_IMPORT_DESTILADOS_SEEDS.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    productLinkRe: /href="(https?:\/\/[^"?#]+\/(?:producto|tienda|product)[^"?#]+)"/gi,
    normalizeProductUrl: (href, pageUrl) => {
      if (href.startsWith("http")) return href;
      return new URL(href, pageUrl).href;
    },
  },
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parsePriceCents(raw: string | number | undefined | null): number {
  if (raw == null) return 0;
  let s = String(raw).replace(/€|\s|EUR|\$|USD/gi, "").trim();
  if (!s) return 0;
  if (s.includes(".") && s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const v = parseFloat(s);
  return Number.isFinite(v) && v > 0 ? Math.round(v * 100) : 0;
}

export function parseVolumeMl(text: string | undefined | null): number | null {
  if (!text) return null;
  const match = text.toLowerCase().match(/([\d.,]+)\s*(l|cl|ml)\b/);
  if (!match) return null;
  const num = parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(num)) return null;
  const unit = match[2];
  if (unit === "l") return Math.round(num * 1000);
  if (unit === "cl") return Math.round(num * 10);
  return Math.round(num);
}

export function formatFromVolumeMl(ml: number | null): { format: string; volumeMl: number | null } {
  if (ml == null) return { format: "UNIT", volumeMl: null };
  if (ml === 750) return { format: "BOTTLE_75CL", volumeMl: ml };
  if (ml === 3000) return { format: "BAG_IN_BOX_3L", volumeMl: ml };
  return { format: "UNIT", volumeMl: ml };
}

export function categoryFromSpiritText(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("vermut") || t.includes("vermouth")) return "VERMUT";
  if (t.includes("sirope") || t.includes("jarabe") || t.includes("syrup")) return "SIROPE";
  if (t.includes("tonica") || t.includes("tónica") || t.includes("refresco") || t.includes("soda")) return "SODA";
  return "ALCOHOL";
}

function firstString(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return firstString(value[0]);
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return firstString(obj.url ?? obj.name ?? obj["@id"]);
  }
  return null;
}

function flattenJsonLdNodes(json: unknown): Record<string, unknown>[] {
  if (!json) return [];
  if (Array.isArray(json)) return json.flatMap(flattenJsonLdNodes);
  if (typeof json !== "object") return [];
  const obj = json as Record<string, unknown>;
  if (Array.isArray(obj["@graph"])) {
    return (obj["@graph"] as unknown[]).flatMap(flattenJsonLdNodes);
  }
  return [obj];
}

export function extractJsonLdBlocks(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      out.push(JSON.parse(m[1].trim()));
    } catch {
      // ignore invalid JSON-LD
    }
  }
  return out;
}

export function findProductNodes(html: string): Record<string, unknown>[] {
  const products: Record<string, unknown>[] = [];
  for (const block of extractJsonLdBlocks(html)) {
    for (const node of flattenJsonLdNodes(block)) {
      const type = node["@type"];
      const isProduct =
        type === "Product" || (Array.isArray(type) && type.includes("Product"));
      if (isProduct) products.push(node);
    }
  }
  return products;
}

function breadcrumbLabels(html: string): string[] {
  const labels: string[] = [];
  for (const block of extractJsonLdBlocks(html)) {
    for (const node of flattenJsonLdNodes(block)) {
      if (node["@type"] !== "BreadcrumbList") continue;
      const items = node.itemListElement;
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const row = item as Record<string, unknown>;
        const nested = row.item as Record<string, unknown> | undefined;
        const name = row.name ?? nested?.name;
        if (typeof name === "string") labels.push(name);
      }
    }
  }
  return labels;
}

function extractOfferPrice(offers: unknown): number {
  if (!offers) return 0;
  const list = Array.isArray(offers) ? offers : [offers];
  for (const offer of list) {
    if (!offer || typeof offer !== "object") continue;
    const o = offer as Record<string, unknown>;
    if (o.price != null) return parsePriceCents(o.price as string | number);
    const specs = o.priceSpecification;
    const specList = Array.isArray(specs) ? specs : specs ? [specs] : [];
    for (const spec of specList) {
      if (spec && typeof spec === "object" && (spec as Record<string, unknown>).price != null) {
        return parsePriceCents((spec as Record<string, unknown>).price as string | number);
      }
    }
  }
  return 0;
}

function metaContent(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  return html.match(re)?.[1] ?? null;
}

function spiritTypeFromBreadcrumbs(crumbs: string[]): string | undefined {
  const joined = crumbs.join(" ").toLowerCase();
  const types = [
    "ginebra",
    "gin",
    "ron",
    "vodka",
    "whisky",
    "whiskey",
    "tequila",
    "mezcal",
    "brandy",
    "cognac",
    "licor",
    "vermut",
    "bitters",
    "amaro",
    "aperitivo",
  ];
  return types.find((t) => joined.includes(t));
}

function normalizeImageUrl(image: string | null, pageUrl: string): string | null {
  if (!image) return null;
  let url = image.trim();
  if (url.startsWith("//")) url = `https:${url}`;
  if (!/^https?:\/\//i.test(url)) {
    try {
      url = new URL(url, pageUrl).href;
    } catch {
      return null;
    }
  }
  if (/logo|placeholder|prestashop-17-logo/i.test(url)) return null;
  return url;
}

export function parseSpiritFromHtml(
  html: string,
  sourceUrl: string,
  retailer: SpiritsRetailerSource
): ImportedSpirit | null {
  const nodes = findProductNodes(html);
  const node = nodes[0];
  const crumbs = breadcrumbLabels(html);

  const title = (
    (node?.name as string | undefined) ??
    metaContent(html, "og:title") ??
    ""
  )
    .toString()
    .replace(/\s*[-|].*(Decántalo|Bodeboca|Lafuente|Vila Viniteca).*$/i, "")
    .trim();
  if (!title || title.length < 2) return null;

  const descriptionRaw =
    (node?.description as string | undefined) ??
    metaContent(html, "og:description") ??
    "";
  const description = descriptionRaw.toString().trim().slice(0, 2000) || null;

  const offers = node?.offers;
  const priceCents = extractOfferPrice(offers) || parsePriceCents(metaContent(html, "product:price:amount"));

  const image = normalizeImageUrl(
    firstString(node?.image) ?? metaContent(html, "og:image"),
    sourceUrl
  );

  const volumeText =
    (node?.nxt_formato_botella as string | undefined) ??
    `${title} ${description ?? ""}`;
  const volumeMl = parseVolumeMl(volumeText);
  const { format, volumeMl: vol } = formatFromVolumeMl(volumeMl);

  const brand =
    (node?.brand as Record<string, unknown> | undefined)?.name?.toString() ??
    (node?.manufacturer as Record<string, unknown> | undefined)?.name?.toString();

  const origin =
    (node?.nxt_denominacion_origen as string | undefined)?.trim() ||
    crumbs.find((c) => /espa|ital|franc|inglat|escoc|irland|méxic|jap/i.test(c)) ||
    undefined;

  const spiritType = spiritTypeFromBreadcrumbs(crumbs);
  const category = categoryFromSpiritText(`${title} ${description ?? ""} ${spiritType ?? ""}`);

  const metadata: ProductImportMetadata = {
    retailer: retailer.id,
    retailerLabel: retailer.label,
    brand: brand || undefined,
    origin: origin || undefined,
    spiritType,
    sku: (node?.sku as string | undefined) ?? (node?.mpn as string | undefined),
    history: description && description.length > 120 ? description : undefined,
    referencePriceCents: priceCents > 0 ? priceCents : undefined,
    importedAt: new Date().toISOString(),
  };

  return {
    title,
    slug: slugify(title),
    description: description?.slice(0, 600) ?? null,
    category,
    priceCents,
    imageUrl: image,
    sourceUrl,
    format,
    volumeMl: vol,
    metadata,
  };
}

export function isSpiritProductPage(html: string, retailerId: SpiritsRetailerId): boolean {
  const crumbs = breadcrumbLabels(html).map((c) => c.toLowerCase());
  const joined = crumbs.join(" ");
  const title = (html.match(/"name"\s*:\s*"([^"]+)"/)?.[1] ?? "").toLowerCase();

  if (/catálogo|catalogo|gift card|tarjeta regalo/i.test(title)) return false;

  if (retailerId === "vilaviniteca") {
    return joined.includes("destilados") || joined.includes("vermut") || joined.includes("bitters");
  }
  if (retailerId === "lafuente") {
    return joined.includes("destilados") || joined.includes("vermut");
  }
  if (retailerId === "decantalo" || retailerId === "bodeboca") {
    return /destil|gin|ron|vodka|whisk|tequila|mezcal|licor|vermut|bitter|amaro|aperitiv/i.test(joined + title);
  }
  return true;
}

const VV_CATEGORY_SLUGS = new Set([
  "destilados",
  "vinos",
  "espumosos",
  "gourmet-y-accesorios",
  "gourmet",
  "otras-bebidas",
  "catalogsearch",
]);

function isLikelyProductUrl(url: string, source: SpiritsRetailerSource): boolean {
  try {
    const u = new URL(url);
    if (source.id === "vilaviniteca") {
      const slug = u.pathname.match(/\/es\/([^/]+)\.html$/)?.[1];
      if (!slug || slug.includes("/")) return false;
      if (VV_CATEGORY_SLUGS.has(slug)) return false;
      if (/^(destilados|vinos|espumosos|gourmet|otras-bebidas)/.test(slug)) return false;
    }
    if (source.id === "lafuente") {
      if (!u.pathname.includes("/tienda/")) return false;
      if (u.pathname === "/tienda/" || u.pathname.endsWith("/tienda/")) return false;
    }
    if (source.id === "decantalo") {
      if (/\/vino\/|\/content\/|\/destilados\/?$/.test(u.pathname)) return false;
    }
    if (source.id === "bodeboca") {
      if (!u.pathname.startsWith("/vino/")) return false;
      if (u.pathname.split("/").length <= 3) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function discoverProductUrlsFromHtml(
  html: string,
  pageUrl: string,
  source: SpiritsRetailerSource
): string[] {
  const urls = new Set<string>();
  source.productLinkRe.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = source.productLinkRe.exec(html))) {
    const normalized = source.normalizeProductUrl(m[1], pageUrl);
    if (!normalized) continue;
    if (/content\/|politica|preguntas|cart|checkout|my-account|login/i.test(normalized)) continue;
    if (!isLikelyProductUrl(normalized, source)) continue;
    urls.add(normalized.split("#")[0]);
  }
  return [...urls];
}

export function mergeSpiritCatalog(
  existing: ImportedSpirit[],
  incoming: ImportedSpirit[],
  opts: { overwrite?: boolean } = {}
): { merged: ImportedSpirit[]; added: number; updated: number } {
  const bySlug = new Map(existing.map((p) => [p.slug, p]));
  let added = 0;
  let updated = 0;

  for (const item of incoming) {
    if (!item.slug) continue;
    const prev = bySlug.get(item.slug);
    if (!prev) {
      bySlug.set(item.slug, item);
      added++;
      continue;
    }
    if (opts.overwrite) {
      bySlug.set(item.slug, {
        ...prev,
        ...item,
        metadata: { ...prev.metadata, ...item.metadata },
      });
      updated++;
      continue;
    }
    const merged: ImportedSpirit = {
      ...prev,
      description: prev.description || item.description,
      priceCents: prev.priceCents > 0 ? prev.priceCents : item.priceCents,
      imageUrl: prev.imageUrl || item.imageUrl,
      sourceUrl: prev.sourceUrl || item.sourceUrl,
      volumeMl: prev.volumeMl ?? item.volumeMl,
      format: prev.format !== "UNIT" ? prev.format : item.format,
      metadata: {
        ...prev.metadata,
        ...item.metadata,
        referencePrices: {
          ...(prev.metadata?.referencePrices ?? {}),
          ...(item.metadata?.retailer && item.metadata.referencePriceCents
            ? { [item.metadata.retailer]: item.metadata.referencePriceCents }
            : {}),
        },
      },
    };
    if (JSON.stringify(merged) !== JSON.stringify(prev)) updated++;
    bySlug.set(item.slug, merged);
  }

  return { merged: [...bySlug.values()], added, updated };
}
