// ─────────────────────────────────────────────────────────────────────────────
// Construye data/products.json (fuente base del catalogo de tienda) a partir de
// los CSV de Productos/. Normaliza precio a centimos, formato, foto, enlace y
// categoria. Es la fuente que consume scripts/seed-demo.ts.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "fs";
import path from "path";
import csvParser from "csv-parser";

export interface ProductImportMetadata {
  retailer?: string;
  retailerLabel?: string;
  brand?: string;
  origin?: string;
  spiritType?: string;
  sku?: string;
  history?: string;
  referencePriceCents?: number;
  referencePrices?: Record<string, number>;
  importedAt?: string;
}

export interface NormalizedProduct {
  title: string;
  slug: string;
  description: string | null;
  category: string; // ProductCategory enum value
  priceCents: number;
  imageUrl: string | null;
  sourceUrl: string | null;
  format: string; // ProductFormat enum value
  volumeMl: number | null;
  metadata?: ProductImportMetadata;
}

const PRODUCTOS_DIR = path.resolve(process.cwd(), "Productos");
const OUTPUT = path.resolve(process.cwd(), "data", "products.json");

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePriceCents(raw: string | undefined): number {
  if (!raw) return 0;
  let s = String(raw).replace(/€|\s|EUR/gi, "").trim();
  if (!s) return 0;
  if (s.includes(".") && s.includes(",")) {
    // 1.234,56 -> 1234.56
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const value = parseFloat(s);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 100);
}

function categoryFromTipo(tipo: string | undefined, title: string): string {
  const t = `${tipo ?? ""} ${title}`.toLowerCase();
  if (t.includes("vermut") || t.includes("vermouth")) return "VERMUT";
  if (t.includes("sirope") || t.includes("syrup") || t.includes("jarabe"))
    return "SIROPE";
  if (t.includes("soda") || t.includes("refresco") || t.includes("tonica") || t.includes("tónica"))
    return "SODA";
  // vinos, ginebras, licores, etc.
  return "ALCOHOL";
}

function formatFromVolumen(volumen: string | undefined): { format: string; volumeMl: number | null } {
  const v = (volumen ?? "").toLowerCase();
  const match = v.match(/([\d.,]+)\s*(l|cl|ml)/);
  if (!match) return { format: "UNIT", volumeMl: null };
  const num = parseFloat(match[1].replace(",", "."));
  const unit = match[2];
  let ml: number | null = null;
  if (unit === "l") ml = Math.round(num * 1000);
  else if (unit === "cl") ml = Math.round(num * 10);
  else ml = Math.round(num);

  if (ml === 750) return { format: "BOTTLE_75CL", volumeMl: ml };
  if (ml === 3000) return { format: "BAG_IN_BOX_3L", volumeMl: ml };
  return { format: "UNIT", volumeMl: ml };
}

function cleanImage(url: string | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  if (!/^https?:\/\//i.test(u)) return null;
  if (/\.svg(\?|$)/i.test(u)) return null; // iconos placeholder
  return u;
}

function cleanUrl(url: string | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  return /^https?:\/\//i.test(u) ? u : null;
}

function readCsv(file: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    fs.createReadStream(file)
      .pipe(csvParser({ separator: ";" }))
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

function pick(row: Record<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    const found = Object.keys(row).find(
      (k) => k.trim().toLowerCase() === key.toLowerCase()
    );
    if (found && row[found]) return row[found];
  }
  return undefined;
}

async function build() {
  if (!fs.existsSync(PRODUCTOS_DIR)) {
    console.error("No existe la carpeta Productos/.");
    process.exit(1);
  }

  const csvFiles = fs
    .readdirSync(PRODUCTOS_DIR)
    .filter((f) => f.endsWith(".csv"))
    .map((f) => path.join(PRODUCTOS_DIR, f));

  const bySlug = new Map<string, NormalizedProduct>();

  for (const file of csvFiles) {
    let rows: Record<string, string>[] = [];
    try {
      rows = await readCsv(file);
    } catch (err) {
      console.warn(`No se pudo leer ${path.basename(file)}:`, err);
      continue;
    }

    for (const row of rows) {
      const title = (pick(row, ["Nombre_Referencia", "Nombre Referencia", "Nombre Cóctel"]) ?? "").trim();
      if (!title) continue;

      const slug = slugify(title);
      if (!slug || bySlug.has(slug)) continue;

      // Si la columna es "Tipo de Vermut", la fila es por definicion un vermut.
      const tipoDeVermut = pick(row, ["Tipo de Vermut"]);
      const category = tipoDeVermut ? "VERMUT" : categoryFromTipo(pick(row, ["Tipo"]), title);
      const { format, volumeMl } = formatFromVolumen(pick(row, ["Volumen (Formato)", "Formato"]));
      const priceCents = parsePriceCents(
        pick(row, ["Precio_Num_€", "Precio con IVA", "Precio_Bruto", "Precio"])
      );
      const description = (pick(row, ["Descripción", "Descripcion"]) ?? "").toString().slice(0, 600).trim() || null;

      bySlug.set(slug, {
        title,
        slug,
        description,
        category,
        priceCents, // 0 => seed asignara fallback
        imageUrl: cleanImage(pick(row, ["Foto Botella", "Foto"])),
        sourceUrl: cleanUrl(pick(row, ["Enlace Web", "Enlace Web Oficial", "Enlace Original"])),
        format,
        volumeMl,
      });
    }
  }

  const products = [...bySlug.values()];
  fs.writeFileSync(OUTPUT, JSON.stringify(products, null, 2), "utf-8");
  const withPrice = products.filter((p) => p.priceCents > 0).length;
  const withImage = products.filter((p) => p.imageUrl).length;
  console.log(
    `✓ data/products.json -> ${products.length} productos (con precio: ${withPrice}, con foto: ${withImage}).`
  );
}

build().catch((err) => {
  console.error("Error construyendo productos:", err);
  process.exit(1);
});
