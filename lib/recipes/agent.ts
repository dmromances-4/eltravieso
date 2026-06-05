import ai from "@/lib/ai/provider";
import prisma from "@/lib/prisma";
import {
  buildSearchContext,
  getCatalogRecipes,
  searchCatalog,
} from "@/lib/recipes/catalog";
import { parseIngredientList, parseJsonObject, type IngredientItem } from "@/lib/recipes/parse";
import { generateAndUploadRecipeCover } from "@/lib/recipes/generate-recipe-image";
import { buildAgentStyleAppendix } from "@/lib/recipes/style-guide";
import { slugify } from "@/lib/utils/slug";

function parseNumber(value: unknown) {
  if (value == null) return null;
  const numberValue = Number(String(value).replace(/[^0-9.,-]+/g, "").replace(",", "."));
  return Number.isFinite(numberValue) ? numberValue : null;
}

async function ensureUniqueSlug(baseSlug: string) {
  let slug = baseSlug;
  let index = 1;
  while (await prisma.recipe.findUnique({ where: { slug } })) {
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

function buildPrompt(promptText: string, catalogContext: string) {
  return `Eres un mixólogo experto en vermutería premium. El cliente te envía un briefing en español (puede ser una idea, comentarios, restricciones o una adaptación de otra receta).

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

async function requestRecipeJson(prompt: string, maxTokens: number) {
  const textRes = await ai.generateText(prompt, { maxTokens });
  const parsed = parseJsonObject(textRes.text);
  if (!parsed) {
    throw new Error("La IA no devolvió un JSON válido. Intenta de nuevo con más detalle.");
  }
  return parsed;
}

async function ensureIngredients(
  parsed: Record<string, unknown>,
  promptText: string,
): Promise<IngredientItem[]> {
  let ingredients = parseIngredientList(parsed.ingredients ?? parsed.items);
  if (ingredients.length >= 3) return ingredients;

  const repairPrompt = `Genera SOLO un JSON con la clave "ingredients": lista de al menos 4 objetos {name, amount} con cantidades exactas (ml, dashes, etc.) para este cóctel en español: ${parsed.title ?? promptText}. Sin texto adicional.`;
  const repaired = await requestRecipeJson(repairPrompt, 500);
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
  options: { userId?: string | null } = {},
): Promise<AgentRecipeResult> {
  try {
    const catalog = await getCatalogRecipes();
    const matches = searchCatalog(catalog, promptText, 6);
    const catalogContext = buildSearchContext(matches);

    const parsed = await requestRecipeJson(buildPrompt(promptText, catalogContext), 900);

    const title = String(parsed.title ?? parsed.name ?? `Cóctel ${promptText.split(/\s+/).slice(0, 3).join(" ")}`).trim();
    const summary = String(parsed.summary ?? parsed.description ?? "Receta creada por el agente de barra.").trim();
    const glass = String(parsed.glass ?? parsed.glassType ?? parsed.serveIn ?? "Copa balón").trim();
    const method = String(parsed.method ?? parsed.instructions ?? "Mezclar, enfriar y servir.").trim();
    const ingredients = await ensureIngredients(parsed, promptText);
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
