// ─────────────────────────────────────────────────────────────────────────────
// Semilla de DEMO (local, sin red). Deja la app lista para presentacion:
//   - Usuario demo ADMIN verificado.
//   - Catalogo de tienda desde data/products.json (vermut/alcohol).
//   - Productos-INGREDIENTE derivados de TODAS las recetas (cocktails.json).
//   - Productos extra para que TODAS las pestanas tengan articulos.
//   - Recetas demo (autor demo) para /cuenta y editor de video.
//   - Datos B2B: BarProfile + ProductionBatch + BarStock.
// Ejecutar: npx tsx scripts/seed-demo.ts
// ─────────────────────────────────────────────────────────────────────────────

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import type { NormalizedProduct } from "./build-products";
import { slugify } from "../lib/utils/slug";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@eltravieso.bar";
const DEMO_PASSWORD = "demo1234";

// Precio fallback (centimos) por categoria cuando el CSV no trae precio.
const FALLBACK_PRICE: Record<string, number> = {
  VERMUT: 1290,
  ALCOHOL: 1490,
  SIROPE: 790,
  SODA: 350,
  CRISTALERIA: 990,
  MATERIAL: 1490,
  ROPA: 2490,
  MERCH: 1990,
  COCTELERIA: 2990,
  INGREDIENTE: 490,
  CONSERVA_LATERIO: 690,
};

function typeForCategory(category: string): "CONSUMABLE" | "MERCH" | "CONSERVA" {
  if (category === "CONSERVA_LATERIO") return "CONSERVA";
  if (category === "MERCH" || category === "ROPA" || category === "MATERIAL" || category === "CRISTALERIA")
    return "MERCH";
  return "CONSUMABLE";
}

function readJson<T>(rel: string, fallback: T): T {
  const file = path.resolve(process.cwd(), rel);
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

// Crea/actualiza un Product con una variante principal.
async function upsertProductWithVariant(input: {
  title: string;
  slug: string;
  description: string | null;
  category: string;
  priceCents: number;
  imageUrl: string | null;
  format: string;
  volumeMl: number | null;
  skuPrefix: string;
  stock?: number;
}) {
  const price = input.priceCents > 0 ? input.priceCents : FALLBACK_PRICE[input.category] ?? 990;
  const product = await prisma.product.upsert({
    where: { slug: input.slug },
    update: {
      title: input.title,
      description: input.description,
      type: typeForCategory(input.category) as any,
      category: input.category as any,
      imageUrl: input.imageUrl,
      volumeMl: input.volumeMl,
      isActive: true,
    },
    create: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      type: typeForCategory(input.category) as any,
      category: input.category as any,
      channel: "BOTH",
      imageUrl: input.imageUrl,
      volumeMl: input.volumeMl,
      isActive: true,
    },
  });

  const sku = `${input.skuPrefix}-${input.slug}`.slice(0, 60);
  await prisma.productVariant.upsert({
    where: { sku },
    update: { priceCents: price, isActive: true },
    create: {
      productId: product.id,
      sku,
      format: input.format as any,
      channel: "B2C",
      priceCents: price,
      minOrderQty: 1,
      stock: input.stock ?? 100,
    },
  });

  return product;
}

// ── Ingredientes: normalizar nombre quitando cantidades/unidades ───────────────
const UNIT_WORDS = [
  "ml", "cl", "l", "oz", "g", "gr", "kg",
  "dash", "dashes", "gota", "gotas", "cucharada", "cucharadas", "cucharadita", "cucharaditas",
  "cda", "cdta", "parte", "partes", "part", "parts", "chorrito", "chorro", "splash",
  "barspoon", "barspoons", "tsp", "tbsp", "cubo", "cubos", "hoja", "hojas", "ramita", "ramitas",
  "rama", "ramas", "trozo", "trozos", "rodaja", "rodajas", "unidad", "unidades", "ud", "uds",
  "pizca", "pizcas", "vaso", "vasos", "copa", "copas", "shot", "shots",
];
const UNIT_RE = new RegExp(`^(?:${UNIT_WORDS.join("|")})\\.?\\b\\s*`, "i");
const NUM_RE = /^[\d.,/⁄½¼¾\s]+/;
const NOISE_RE = /\b(garnish|adorn|decora|método|metodo|method|serve|stir|shake|strain|fill|build|muddle|remov)/i;

function normalizeIngredientName(raw: string): string | null {
  let name = raw.replace(/^[\s\-–•*]+/, "").trim();
  if (!name) return null;
  if (NOISE_RE.test(name)) return null;
  // Quitar cantidad y unidad inicial (varias pasadas para "1 1/2 oz").
  for (let i = 0; i < 3; i++) {
    name = name.replace(NUM_RE, "").replace(UNIT_RE, "").trim();
  }
  // Quitar parentesis sueltos al final.
  name = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
  if (name.length < 3 || name.length > 60) return null;
  return name;
}

type Cocktail = { title: string; slug: string; ingredients?: string[]; glass?: string; method?: string };

async function seedIngredientProducts(cocktails: Cocktail[]): Promise<number> {
  const seen = new Map<string, string>(); // key -> display name
  for (const c of cocktails) {
    for (const raw of c.ingredients ?? []) {
      const name = normalizeIngredientName(String(raw));
      if (!name) continue;
      const key = slugify(name);
      if (key && !seen.has(key)) seen.set(key, name);
    }
  }

  let count = 0;
  for (const [key, name] of seen) {
    const slug = `ingrediente-${key}`;
    await upsertProductWithVariant({
      title: name,
      slug,
      description: `Ingrediente de coctelería: ${name}.`,
      category: "INGREDIENTE",
      priceCents: 0,
      imageUrl: null,
      format: "UNIT",
      volumeMl: null,
      skuPrefix: "ING",
    });
    count++;
  }
  return count;
}

// ── Productos extra para poblar TODAS las pestanas ─────────────────────────────
const EXTRA_PRODUCTS: Array<{
  title: string;
  category: string;
  description: string;
  priceCents: number;
}> = [
  { title: "Sirope de Goma Casero El Travieso", category: "SIROPE", description: "Sirope de goma artesano para equilibrar tus cócteles.", priceCents: 790 },
  { title: "Sirope de Orgeat (Almendra)", category: "SIROPE", description: "Sirope de almendra tostada, imprescindible para tiki y sours.", priceCents: 890 },
  { title: "Soda Artesana de Cítricos", category: "SODA", description: "Soda premium de cítricos, burbuja fina para highballs.", priceCents: 350 },
  { title: "Tónica Premium El Travieso", category: "SODA", description: "Tónica seca con quinina natural.", priceCents: 320 },
  { title: "Copa de Vermut Grabada", category: "CRISTALERIA", description: "Copa de vermut de cristal grabada con el logo canalla.", priceCents: 1290 },
  { title: "Vaso Old Fashioned (set 2)", category: "CRISTALERIA", description: "Pareja de vasos de roca de base gruesa.", priceCents: 1690 },
  { title: "Coctelera Boston Inox", category: "CRISTALERIA", description: "Coctelera Boston de acero inoxidable para profesionales.", priceCents: 2490 },
  { title: "Kit Bartender Profesional", category: "MATERIAL", description: "Set completo: jigger, cucharilla, colador y muddler.", priceCents: 3990 },
  { title: "Cuchillo de Cítricos", category: "MATERIAL", description: "Cuchillo afilado para garnish y peladuras perfectas.", priceCents: 1490 },
  { title: "Hielera Vintage de Acero", category: "MATERIAL", description: "Hielera retro para servicio de barra.", priceCents: 2990 },
  { title: "Camiseta El Travieso 'Canalla'", category: "ROPA", description: "Camiseta negra de algodón orgánico con estampado canalla.", priceCents: 2490 },
  { title: "Delantal de Bartender", category: "ROPA", description: "Delantal de lona resistente con bolsillos para herramientas.", priceCents: 2990 },
  { title: "Tote Bag El Travieso", category: "MERCH", description: "Bolsa de tela serigrafiada, perfecta para tus botellas.", priceCents: 1290 },
  { title: "Pack Posavasos (x6)", category: "MERCH", description: "Posavasos de corcho con ilustraciones de cócteles.", priceCents: 990 },
  { title: "Kit Coctelería Vermut Rojo", category: "COCTELERIA", description: "Todo para preparar el vermut perfecto en casa.", priceCents: 2990 },
  { title: "Set Degustación Coctelería de Autor", category: "COCTELERIA", description: "Selección de minis para una cata guiada.", priceCents: 3490 },
];

async function seedExtraProducts(): Promise<number> {
  for (const item of EXTRA_PRODUCTS) {
    await upsertProductWithVariant({
      title: item.title,
      slug: slugify(item.title),
      description: item.description,
      category: item.category,
      priceCents: item.priceCents,
      imageUrl: null,
      format: "UNIT",
      volumeMl: null,
      skuPrefix: "EXT",
    });
  }
  return EXTRA_PRODUCTS.length;
}

async function seedCatalogProducts(): Promise<number> {
  const products = readJson<NormalizedProduct[]>("data/products.json", []);
  for (const p of products) {
    await upsertProductWithVariant({
      title: p.title,
      slug: p.slug,
      description: p.description,
      category: p.category,
      priceCents: p.priceCents,
      imageUrl: p.imageUrl,
      format: p.format,
      volumeMl: p.volumeMl,
      skuPrefix: "CAT",
    });
  }
  return products.length;
}

async function seedDemoRecipes(authorId: string, cocktails: Cocktail[]): Promise<number> {
  const subset = cocktails.slice(0, 24);
  for (const c of subset) {
    const ingredients = JSON.stringify(c.ingredients ?? []);
    const existing = await prisma.recipe.findUnique({ where: { slug: c.slug } });
    if (existing) {
      await prisma.recipe.update({
        where: { slug: c.slug },
        data: { ingredients, method: c.method ?? null, authorId, isPublished: true },
      });
    } else {
      await prisma.recipe.create({
        data: {
          title: c.title,
          slug: c.slug,
          summary: `Receta del catálogo El Travieso: ${c.title}.`,
          ingredients,
          method: c.method ?? "Mezclar con hielo y servir bien frío.",
          authorId,
          isPublished: true,
          tags: ["vermut", "demo"],
        },
      });
    }
  }
  return subset.length;
}

async function seedB2B(userId: string) {
  const bar = await prisma.barProfile.upsert({
    where: { userId },
    update: {
      latitude: 41.3825,
      longitude: 2.1769,
      venueType: "cocteleria",
      isPublicOnMap: true,
      photoUrl: "/cocktail-placeholder.svg",
    },
    create: {
      userId,
      businessName: "Bar El Travieso (Demo)",
      taxId: "B-DEMO-0001",
      address: "Calle del Vermut, 23",
      city: "Barcelona",
      postalCode: "08001",
      province: "Barcelona",
      phone: "+34 600 000 000",
      email: DEMO_EMAIL,
      autoReorderEnabled: true,
      autoReorderThreshold: 12,
      latitude: 41.3825,
      longitude: 2.1769,
      venueType: "cocteleria",
      isPublicOnMap: true,
      photoUrl: "/cocktail-placeholder.svg",
    },
  });

  // Producto de referencia para el lote (el primer VERMUT del catalogo).
  const vermut =
    (await prisma.product.findFirst({ where: { category: "VERMUT" } })) ??
    (await prisma.product.findFirst());

  const batch = await prisma.productionBatch.upsert({
    where: { batchCode: "LOT-DEMO-A001" },
    update: { status: "AVAILABLE", remainingUnits: 480 },
    create: {
      batchCode: "LOT-DEMO-A001",
      productId: vermut?.id ?? null,
      status: "AVAILABLE",
      totalUnits: 600,
      remainingUnits: 480,
      bottlingDate: new Date(),
      abv: 1500,
      notes: "Lote de demostración disponible para reparto.",
    },
  });

  const variant = vermut
    ? await prisma.productVariant.findFirst({ where: { productId: vermut.id } })
    : null;
  if (vermut && variant) {
    await prisma.barStock.upsert({
      where: {
        barProfileId_productId_variantId: {
          barProfileId: bar.id,
          productId: vermut.id,
          variantId: variant.id,
        },
      },
      update: { currentUnits: 8, minThreshold: 12 },
      create: {
        barProfileId: bar.id,
        productId: vermut.id,
        variantId: variant.id,
        currentUnits: 8,
        minThreshold: 12,
        maxCapacity: 60,
      },
    });
  }

  return { bar: bar.businessName, batch: batch.batchCode };
}

async function main() {
  console.log("⏳ Sembrando datos de demo...");

  // 1) Usuario demo.
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { role: "ADMIN", ageVerifiedAt: new Date(), isTwoFactorEnabled: false },
    create: {
      email: DEMO_EMAIL,
      name: "Demo El Travieso",
      password: passwordHash,
      role: "ADMIN",
      ageVerifiedAt: new Date(),
      emailVerified: new Date(),
      isTwoFactorEnabled: false,
    },
  });
  console.log(`✓ Usuario demo: ${DEMO_EMAIL} / ${DEMO_PASSWORD} (ADMIN)`);

  // 2) Catalogo base.
  const catalogCount = await seedCatalogProducts();
  console.log(`✓ Productos de catálogo: ${catalogCount}`);

  // 3) Productos extra (todas las pestanas con contenido).
  const extraCount = await seedExtraProducts();
  console.log(`✓ Productos extra (siropes, sodas, cristalería, material, ropa, merch...): ${extraCount}`);

  // 4) Ingredientes como articulos.
  const cocktails = readJson<Cocktail[]>("data/cocktails.json", []);
  const ingredientCount = await seedIngredientProducts(cocktails);
  console.log(`✓ Productos-ingrediente derivados de recetas: ${ingredientCount}`);

  // 5) Recetas demo (autor demo).
  const recipeCount = await seedDemoRecipes(user.id, cocktails);
  console.log(`✓ Recetas demo (autor demo): ${recipeCount} (catálogo total visible: ${cocktails.length})`);

  // 6) B2B.
  const b2b = await seedB2B(user.id);
  console.log(`✓ B2B: ${b2b.bar} + lote ${b2b.batch}`);

  const totalProducts = await prisma.product.count();
  console.log(`\n✅ Demo lista. Productos totales en tienda: ${totalProducts}.`);
}

main()
  .catch((error) => {
    console.error("Error sembrando demo:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
