import type { AppLocale } from "@/i18n/routing";
import ai from "@/lib/ai/provider";
import prisma from "@/lib/prisma";
import {
  buildSearchContext,
  getCatalogRecipes,
  searchCatalog,
} from "@/lib/recipes/catalog";
import cocktailsJson from "@/data/cocktails.json";
import type { CocktailRecord } from "@/types/cocktail";
import { parseIngredientList, parseJsonObject, type IngredientItem } from "@/lib/recipes/parse";
import { generateAndUploadRecipeCover } from "@/lib/recipes/generate-recipe-image";
import { buildAgentStyleAppendix } from "@/lib/recipes/style-guide";
import { slugify } from "@/lib/utils/slug";

function parseNumber(value: unknown) {
  if (value == null) return null;
  const numberValue = Number(String(value).replace(/[^0-9.,-]+/g, "").replace(",", "."));
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const staticSlugs = new Set((cocktailsJson as CocktailRecord[]).map((r) => r.slug));

async function slugExists(slug: string): Promise<boolean> {
  if (staticSlugs.has(slug)) return true;
  const existing = await prisma.recipe.findUnique({ where: { slug }, select: { id: true } });
  return Boolean(existing);
}

async function findExistingRecipeByTitle(title: string): Promise<{ slug: string; title: string } | null> {
  const normalized = normalizeTitle(title);
  if (!normalized) return null;

  const staticMatch = (cocktailsJson as CocktailRecord[]).find(
    (r) => normalizeTitle(r.title) === normalized,
  );
  if (staticMatch) return { slug: staticMatch.slug, title: staticMatch.title };

  const catalog = await getCatalogRecipes();
  const catalogMatch = catalog.find((r) => normalizeTitle(r.title) === normalized);
  if (catalogMatch) return { slug: catalogMatch.slug, title: catalogMatch.title };

  const dbRecipes = await prisma.recipe.findMany({ select: { slug: true, title: true } });
  const dbMatch = dbRecipes.find((r) => normalizeTitle(r.title) === normalized);
  return dbMatch ?? null;
}

async function ensureUniqueSlug(baseSlug: string) {
  let slug = baseSlug;
  let index = 1;
  while (await slugExists(slug)) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }
  return slug;
}

async function resolveAuthorId(preferredUserId?: string | null) {
  if (preferredUserId) return preferredUserId;

  const systemUser =
    (await prisma.user.findFirst({ where: { email: "system@eltravieso.com" } })) ??
    (await prisma.user.findFirst({ where: { role: "ADMIN" } })) ??
    (await prisma.user.findFirst());

  if (systemUser) return systemUser.id;

  const created = await prisma.user.create({
    data: {
      email: "system@eltravieso.com",
      password: "not-used",
      name: "El Travieso Bot",
      role: "ADMIN",
    },
  });

  return created.id;
}

function buildPrompt(promptText: string, catalogContext: string, locale: AppLocale = "es") {
  const languageNote =
    locale === "en"
      ? "The client briefing may be in English. Respond with JSON field values in English."
      : "El briefing del cliente está en español. Responde con los valores JSON en español.";

  return `Eres un mixólogo experto en vermutería premium. ${languageNote}

${catalogContext}

Briefing del cliente:
"""
${promptText}
"""

Responde ÚNICAMENTE con un JSON válido (sin markdown ni texto extra) con esta estructura exacta:
${buildAgentStyleAppendix()}

{
  "title": "nombre del cóctel",
  "summary": "2-3 frases de concepto",
  "glass": "tipo de vaso específico (ej: copa balón, vaso old fashioned, copa martini)",
  "ingredients": [{"name": "ingrediente", "amount": "cantidad exacta con unidad (ej: 60 ml, 2 dashes, 15 g)"}],
  "method": "1. Primer paso\\n2. Segundo paso\\n3. Tercer paso",
  "abv": número o null,
  "cost": número en EUR o null,
  "slug": "slug-corto-en-minusculas",
  "tasting": "notas organolépticas breves"
}

Reglas estrictas:
- NO inventes marcas ni productos inexistentes; usa ingredientes reales de coctelería.
- ingredients debe tener al menos 3 elementos con cantidades exactas y unidades (ml, cl, dashes, gotas, unidades).
- glass debe ser un tipo de vaso concreto, nunca genérico como "copa" sin especificar.
- method debe ser pasos numerados, uno por línea.
- Prioriza vermut rojo El Travieso / Strucchi cuando encaje.
- slug solo minúsculas, guiones y sin acentos.`;
}

async function requestRecipeJson(prompt: string, maxTokens: number, locale: AppLocale = "es") {
  const textRes = await ai.generateText(prompt, { maxTokens, locale });
  const parsed = parseJsonObject(textRes.text);
  if (!parsed) {
    throw new Error("La IA no devolvió un JSON válido. Intenta de nuevo con más detalle.");
  }
  return parsed;
}

async function ensureIngredients(
  parsed: Record<string, unknown>,
  promptText: string,
  locale: AppLocale = "es",
): Promise<IngredientItem[]> {
  let ingredients = parseIngredientList(parsed.ingredients ?? parsed.items);
  if (ingredients.length >= 3) return ingredients;

  const repairPrompt = `Genera SOLO un JSON con la clave "ingredients": lista de al menos 4 objetos {name, amount} con cantidades exactas (ml, dashes, etc.) para este cóctel: ${parsed.title ?? promptText}. Sin texto adicional.`;
  const repaired = await requestRecipeJson(repairPrompt, 500, locale);
  ingredients = parseIngredientList(repaired.ingredients ?? repaired.items);
  return ingredients;
}

function validateRecipeOutput(
  title: string,
  method: string,
  glass: string,
  ingredients: IngredientItem[],
) {
  if (!title.trim()) {
    throw new Error("La receta generada no tiene título válido.");
  }
  if (ingredients.length < 3) {
    throw new Error("La receta debe incluir al menos 3 ingredientes con medidas exactas.");
  }
  if (!method.trim() || method.trim().length < 20) {
    throw new Error("Las instrucciones de preparación están incompletas.");
  }
  if (!glass.trim() || glass.trim().length < 3) {
    throw new Error("Debe especificarse un tipo de vaso concreto.");
  }
}

export type AgentRecipeResult = {
  title: string;
  summary: string;
  glass: string;
  ingredients: IngredientItem[];
  method: string;
  abv: number | null;
  cost: number | null;
  slug: string;
  tasting: string;
  saved: boolean;
  savedAsUser: boolean;
  viewUrl: string;
  matches: Array<{ title: string; slug: string; ingredients: string[] }>;
  message: string;
};

export async function createRecipeFromPrompt(
  promptText: string,
  options: { userId?: string | null; locale?: AppLocale } = {},
): Promise<AgentRecipeResult> {
  const locale = options.locale ?? "es";
  try {
    const catalog = await getCatalogRecipes(locale);
    const matches = searchCatalog(catalog, promptText, 6);
    const catalogContext = buildSearchContext(matches);

    const parsed = await requestRecipeJson(buildPrompt(promptText, catalogContext, locale), 900, locale);

    const title = String(parsed.title ?? parsed.name ?? `Cóctel ${promptText.split(/\s+/).slice(0, 3).join(" ")}`).trim();
    const existing = await findExistingRecipeByTitle(title);
    if (existing) {
      throw new Error(
        `Ya existe una receta similar: «${existing.title}» (/recetas/${existing.slug}). Refina el briefing o edita esa ficha.`,
      );
    }
    const summary = String(parsed.summary ?? parsed.description ?? "Receta creada por el agente de barra.").trim();
    const glass = String(parsed.glass ?? parsed.glassType ?? parsed.serveIn ?? "Copa balón").trim();
    const method = String(parsed.method ?? parsed.instructions ?? "Mezclar, enfriar y servir.").trim();
    const ingredients = await ensureIngredients(parsed, promptText, locale);
    const abv = parseNumber(parsed.abv);
    const cost = parseNumber(parsed.cost);
    const tasting = String(parsed.tasting ?? parsed.organolepticDesc ?? summary).trim();
    const requestedSlug = String(parsed.slug || slugify(title) || `coctel-${Date.now()}`).trim();
    const slug = await ensureUniqueSlug(slugify(requestedSlug) || slugify(title));

    validateRecipeOutput(title, method, glass, ingredients);

    const authorId = await resolveAuthorId(options.userId);
    const savedAsUser = Boolean(options.userId);

    const created = await prisma.recipe.create({
      data: {
        title,
        slug,
        summary,
        glass,
        ingredients: JSON.stringify(ingredients),
        method,
        authorId,
        technical: {
          create: {
            costCents: cost != null ? Math.round(cost * 100) : null,
            abv: abv ?? undefined,
            tasting,
          },
        },
      },
    });

    try {
      const imageUrl = await generateAndUploadRecipeCover(slug, {
        title,
        glass,
        ingredients: ingredients.map((i) => `${i.amount} ${i.name}`.trim()),
        method,
      });
      await prisma.recipe.update({
        where: { id: created.id },
        data: { imageUrl },
      });
    } catch (imageError) {
      console.warn("[agent] Cover image generation failed:", imageError);
    }

    return {
      title,
      summary,
      glass,
      ingredients,
      method,
      abv,
      cost,
      slug,
      tasting,
      saved: true,
      savedAsUser,
      viewUrl: `/recetas/${slug}`,
      matches: matches.map((recipe) => ({
        title: recipe.title,
        slug: recipe.slug,
        ingredients: recipe.ingredients.slice(0, 4),
      })),
      message: savedAsUser
        ? "Receta creada y guardada en tu cuenta y publicada en el recetario."
        : "Receta creada y publicada en el recetario.",
    };
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Error inesperado al generar la receta.");
  }
}
