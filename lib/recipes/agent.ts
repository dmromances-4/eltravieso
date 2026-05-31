import ai from "@/lib/ai/provider";
import prisma from "@/lib/prisma";
import {
  buildSearchContext,
  getCatalogRecipes,
  searchCatalog,
} from "@/lib/recipes/catalog";
import { parseIngredientList, parseJsonObject, type IngredientItem } from "@/lib/recipes/parse";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

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
{
  "title": "nombre del cóctel",
  "summary": "2-3 frases de concepto",
  "ingredients": [{"name": "ingrediente", "amount": "cantidad con unidad"}],
  "method": "pasos numerados en texto",
  "abv": número o null,
  "cost": número en EUR o null,
  "slug": "slug-corto-en-minusculas",
  "tasting": "notas organolépticas breves"
}

Reglas:
- ingredients debe tener al menos 3 elementos con cantidades realistas.
- Prioriza vermut rojo El Travieso / Strucchi cuando encaje.
- slug solo minúsculas, guiones y sin acentos.`;
}

async function requestRecipeJson(prompt: string, maxTokens: number) {
  const textRes = await ai.generateText(prompt, { maxTokens });
  return parseJsonObject(textRes.text) ?? {};
}

async function ensureIngredients(
  parsed: Record<string, unknown>,
  promptText: string,
): Promise<IngredientItem[]> {
  let ingredients = parseIngredientList(parsed.ingredients ?? parsed.items);
  if (ingredients.length >= 3) return ingredients;

  const repairPrompt = `Genera SOLO un JSON con la clave "ingredients": lista de al menos 4 objetos {name, amount} para este cóctel en español: ${parsed.title ?? promptText}. Sin texto adicional.`;
  const repaired = await requestRecipeJson(repairPrompt, 500);
  ingredients = parseIngredientList(repaired.ingredients ?? repaired.items);
  return ingredients;
}

export type AgentRecipeResult = {
  title: string;
  summary: string;
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
  const catalog = await getCatalogRecipes();
  const matches = searchCatalog(catalog, promptText, 6);
  const catalogContext = buildSearchContext(matches);

  const parsed = await requestRecipeJson(buildPrompt(promptText, catalogContext), 900);

  const title = String(parsed.title ?? parsed.name ?? `Cóctel ${promptText.split(/\s+/).slice(0, 3).join(" ")}`).trim();
  const summary = String(parsed.summary ?? parsed.description ?? "Receta creada por el agente de barra.").trim();
  const method = String(parsed.method ?? parsed.instructions ?? "Mezclar, enfriar y servir.").trim();
  const ingredients = await ensureIngredients(parsed, promptText);
  const abv = parseNumber(parsed.abv);
  const cost = parseNumber(parsed.cost);
  const tasting = String(parsed.tasting ?? parsed.organolepticDesc ?? summary).trim();
  const requestedSlug = String(parsed.slug || slugify(title) || `coctel-${Date.now()}`).trim();
  const slug = await ensureUniqueSlug(slugify(requestedSlug) || slugify(title));

  const authorId = await resolveAuthorId(options.userId);
  const savedAsUser = Boolean(options.userId);

  await prisma.recipe.create({
    data: {
      title,
      slug,
      summary,
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

  return {
    title,
    summary,
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
}
