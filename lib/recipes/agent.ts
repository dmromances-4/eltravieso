import type { AppLocale } from "@/i18n/routing";
import ai from "@/lib/ai/provider";
import prisma from "@/lib/prisma";
import {
  buildSearchContext,
  getCatalogRecipes,
  searchCatalog,
} from "@/lib/recipes/catalog";
import cocktailsJson from "@/data/cocktails.json";
import { parseIngredientList, parseJsonObject, type IngredientItem } from "@/lib/recipes/parse";
import { generateAndUploadRecipeCover } from "@/lib/recipes/generate-recipe-image";
import { buildAgentStyleAppendix } from "@/lib/recipes/style-guide";
import { analyzeRequest, type RequestIntent } from "@/lib/recipes/intent";
import { scaleRecipe } from "@/lib/recipes/scaling";
import { buildCocktailNarrativeProfile } from "@/lib/story-universe/cocktail/build-profile";
import { persistCocktailProfiles } from "@/lib/story-universe/cocktail/persist-profiles";
import type { CocktailRecord } from "@/types/cocktail";
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

// ─────────────────────────────────────────────────────────────────────────────
// Construcción del prompt según la intención estudiada
// ─────────────────────────────────────────────────────────────────────────────

function sweetnessGuidance(intent: RequestIntent): string {
  switch (intent.sweetness) {
    case "dulce":
      return "Perfil DULCE: usa licores/alcoholes dulces (vermut rojo, ron, licores de frutas, crema), zumos naturales y siropes (azúcar, granadina, agave). Equilibra para que sea goloso pero no empalague.";
    case "seco":
      return "Perfil SECO: minimiza azúcares y siropes; prioriza destilados secos, vermut seco y cítrico justo. Nada empalagoso.";
    case "amargo":
      return "Perfil AMARGO: incorpora bitters, Campari/aperitivos amargos o vermut, con un toque de dulzor solo para equilibrar.";
    case "acido":
      return "Perfil ÁCIDO/CÍTRICO: cítricos frescos (lima, limón, pomelo) y un punto de sirope para equilibrar la acidez; refrescante.";
    default:
      return "Perfil EQUILIBRADO: equilibrio clásico entre alcohol, dulzor y acidez.";
  }
}

function effectGuidance(intent: RequestIntent): string {
  switch (intent.effect) {
    case "fuerte":
      return "EFECTO POTENTE (el cliente quiere que 'pegue'): aumenta la proporción de destilados, reduce mezclas/zumos diluyentes, ABV objetivo ~25-30%. Incluye un aviso de consumo responsable en las notas de cata.";
    case "ligero":
      return "EFECTO LIGERO / ANTI-RESACA: baja graduación (ABV objetivo ~6-10%), prioriza destilados limpios (sin congéneres altos), añade soda/agua/tónica e ingredientes hidratantes (agua de coco, cítricos), evita mezclas muy azucaradas. Recomienda beber agua. Esto reduce la probabilidad de resaca, no la elimina.";
    case "sin_alcohol":
      return "SIN ALCOHOL (mocktail): cero destilados. Construye sabor con zumos, infusiones, soda, siropes y bitters sin alcohol o vermut 0,0. ABV = 0.";
    default:
      return "Graduación estándar de coctelería (ABV ~12-20%).";
  }
}

function difficultyGuidance(intent: RequestIntent): string {
  switch (intent.difficulty) {
    case "facil":
      return "DIFICULTAD FÁCIL: pocos ingredientes (3-5), sin técnicas complejas (nada de clarificados ni infusiones largas); construcción directa en vaso o jarra. Pensado para preparar rápido.";
    case "avanzada":
      return "DIFICULTAD AVANZADA: técnica de autor (batido/doble colado, infusiones, espumas, garnish elaborado) bien explicada paso a paso.";
    default:
      return "DIFICULTAD MEDIA: equilibrio entre vistosidad y facilidad.";
  }
}

function themeGuidance(intent: RequestIntent): string {
  if (!intent.theme) return "";
  return `TEMÁTICA / INSPIRACIÓN: el cóctel debe evocar "${intent.theme}". El nombre y el concepto (summary) deben transmitir ese universo mediante colores, ingredientes y narrativa SIN usar marcas registradas ni nombres protegidos de forma literal. Inspírate en su atmósfera (paleta de color, símbolos, sensaciones), no copies logotipos ni personajes con nombre propio registrado.`;
}

function batchGuidance(intent: RequestIntent): string {
  if (intent.kind !== "batch") return "";
  const isSangria = /sangr|ponche|punch|clerico|tinto de verano/i.test(
    `${intent.theme ?? ""} ${intent.rationale}`,
  );
  const target = intent.volumeLiters
    ? `${intent.volumeLiters} litros totales`
    : intent.servings
      ? `${intent.servings} personas`
      : "un grupo";
  return `PREPARACIÓN PARA COMPARTIR (${isSangria ? "tipo sangría/ponche" : "batch/jarra"}), objetivo: ${target}. IMPORTANTE: da la receta para UNA sola ración (una copa/vaso). El sistema escalará las cantidades automáticamente; tú solo defines la fórmula base por ración con cantidades exactas. Diseña algo que aguante bien preparado en volumen y servido con hielo.`;
}

function buildPrompt(promptText: string, catalogContext: string, intent: RequestIntent, locale: AppLocale = "es") {
  const languageNote =
    locale === "en"
      ? "The client briefing may be in English. Respond with JSON field values in English."
      : "El briefing del cliente está en español. Responde con los valores JSON en español.";

  const guidanceBlocks = [
    sweetnessGuidance(intent),
    effectGuidance(intent),
    difficultyGuidance(intent),
    themeGuidance(intent),
    batchGuidance(intent),
  ]
    .filter(Boolean)
    .map((line) => `- ${line}`)
    .join("\n");

  return `Eres un mixólogo experto en vermutería premium El Travieso. ${languageNote} Has ESTUDIADO la petición del cliente y la has interpretado así: ${intent.rationale}.

${catalogContext}

Briefing original del cliente:
"""
${promptText}
"""

Directrices derivadas de tu análisis (cúmplelas todas):
${guidanceBlocks}

Responde ÚNICAMENTE con un JSON válido (sin markdown ni texto extra) con esta estructura exacta. Da las cantidades SIEMPRE para UNA ración:
${buildAgentStyleAppendix()}

{
  "title": "nombre del cóctel",
  "summary": "2-3 frases de concepto (refleja la temática si la hay)",
  "glass": "tipo de vaso específico (ej: copa balón, vaso old fashioned, copa martini)",
  "ingredients": [{"name": "ingrediente", "amount": "cantidad exacta por ración con unidad (ej: 60 ml, 2 dashes, 15 g)"}],
  "method": "1. Primer paso\\n2. Segundo paso\\n3. Tercer paso",
  "abv": número (% por copa, coherente con el efecto pedido) o null,
  "cost": número en EUR por ración o null,
  "prepTimeMins": número de minutos de preparación por ración o null,
  "slug": "slug-corto-en-minusculas",
  "tasting": "notas organolépticas breves"
}

Reglas estrictas:
- NO inventes marcas ni productos inexistentes; usa ingredientes reales de coctelería.
- ingredients debe tener al menos 3 elementos con cantidades exactas y unidades (ml, cl, dashes, gotas, unidades) POR RACIÓN.
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

function difficultyToInt(intent: RequestIntent): number {
  switch (intent.difficulty) {
    case "facil":
      return 1;
    case "avanzada":
      return 5;
    default:
      return 3;
  }
}

/** Receta generada por el agente, lista para previsualizar o guardar. */
export interface GeneratedRecipe {
  title: string;
  summary: string;
  glass: string;
  ingredients: IngredientItem[];
  method: string;
  abv: number | null;
  cost: number | null;
  prepTimeMins: number | null;
  servings: number;
  difficulty: number;
  tags: string[];
  slug: string;
  tasting: string;
  /** Notas de preparación por lote (solo en batch). */
  batchNotes: string[];
  /** Cómo se interpretó la petición. */
  intent: RequestIntent;
  matches: Array<{ title: string; slug: string; ingredients: string[] }>;
}

export type AgentRecipeResult = GeneratedRecipe & {
  saved: boolean;
  savedAsUser: boolean;
  viewUrl: string | null;
  message: string;
};

/**
 * Estudia la petición y genera la receta (con escalado si procede) SIN guardarla.
 * Pensado para previsualizar; la persistencia se hace luego con saveGeneratedRecipe.
 */
export async function createRecipeFromPrompt(
  promptText: string,
  options: { locale?: AppLocale } = {},
): Promise<GeneratedRecipe> {
  const locale = options.locale ?? "es";
  const [catalog, intent] = await Promise.all([
    getCatalogRecipes(locale),
    analyzeRequest(promptText),
  ]);

  const matches = searchCatalog(catalog, promptText, 6);
  const catalogContext = buildSearchContext(matches);

  const maxTokens = intent.difficulty === "avanzada" ? 1100 : 900;
  const parsed = await requestRecipeJson(buildPrompt(promptText, catalogContext, intent, locale), maxTokens, locale);

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
  const baseIngredients = await ensureIngredients(parsed, promptText, locale);
  const abv = intent.effect === "sin_alcohol" ? 0 : (parseNumber(parsed.abv) ?? intent.targetAbv);
  const cost = parseNumber(parsed.cost);
  const prepTimeMins = parseNumber(parsed.prepTimeMins);
  const tasting = String(parsed.tasting ?? parsed.organolepticDesc ?? summary).trim();
  const requestedSlug = String(parsed.slug || slugify(title) || `coctel-${Date.now()}`).trim();

  validateRecipeOutput(title, method, glass, baseIngredients);

  // Escalado determinista para batch / volumen / nº de personas.
  const isSangria = /sangr|ponche|punch|clerico|tinto de verano/i.test(
    `${title} ${summary} ${intent.theme ?? ""}`,
  );
  const scaled = scaleRecipe(baseIngredients, {
    servings: intent.servings,
    volumeLiters: intent.volumeLiters,
    isSangria,
  });

  const finalMethod =
    scaled.batchNotes.length > 0
      ? `${method}\n\nPreparación por lote:\n${scaled.batchNotes.map((n, i) => `${i + 1}. ${n}`).join("\n")}`
      : method;

  return {
    title,
    summary,
    glass,
    ingredients: scaled.ingredients,
    method: finalMethod,
    abv: abv != null ? Math.round(abv) : null,
    cost: cost != null && scaled.factor !== 1 ? Math.round(cost * scaled.factor * 100) / 100 : cost,
    prepTimeMins: prepTimeMins != null ? Math.round(prepTimeMins) : null,
    servings: scaled.servings,
    difficulty: difficultyToInt(intent),
    tags: intent.tags,
    slug: slugify(requestedSlug) || slugify(title),
    tasting,
    batchNotes: scaled.batchNotes,
    intent,
    matches: matches.map((recipe) => ({
      title: recipe.title,
      slug: recipe.slug,
      ingredients: recipe.ingredients.slice(0, 4),
    })),
  };
}

/**
 * Persiste una receta ya generada (modo "Guardar" tras previsualizar).
 * Genera portada y, si es temática, el perfil narrativo del story-universe.
 */
export async function saveGeneratedRecipe(
  recipe: GeneratedRecipe,
  options: { userId?: string | null } = {},
): Promise<AgentRecipeResult> {
  const slug = await ensureUniqueSlug(recipe.slug || `coctel-${Date.now()}`);
  const authorId = await resolveAuthorId(options.userId);
  const savedAsUser = Boolean(options.userId);

  const created = await prisma.recipe.create({
    data: {
      title: recipe.title,
      slug,
      summary: recipe.summary,
      glass: recipe.glass,
      ingredients: JSON.stringify(recipe.ingredients),
      method: recipe.method,
      authorId,
      difficulty: recipe.difficulty,
      prepTimeMins: recipe.prepTimeMins ?? undefined,
      servings: recipe.servings,
      tags: recipe.tags,
      technical: {
        create: {
          costCents: recipe.cost != null ? Math.round(recipe.cost * 100) : null,
          abv: recipe.abv ?? undefined,
          tasting: recipe.tasting,
        },
      },
    },
  });

  // Portada (no bloqueante).
  try {
    const imageUrl = await generateAndUploadRecipeCover(slug, {
      title: recipe.title,
      glass: recipe.glass,
      ingredients: recipe.ingredients.map((i) => `${i.amount} ${i.name}`.trim()),
      method: recipe.method,
    });
    await prisma.recipe.update({ where: { id: created.id }, data: { imageUrl } });
  } catch (imageError) {
    console.warn("[agent] Cover image generation failed:", imageError);
  }

  // Integración story-universe: las recetas temáticas entran en el universo narrativo.
  if (recipe.intent.theme) {
    try {
      const record: CocktailRecord = {
        id: created.id,
        title: recipe.title,
        slug,
        rating: 8,
        glass: recipe.glass,
        ingredients: recipe.ingredients.map((i) => `${i.amount} ${i.name}`.trim()),
        method: recipe.method,
        abv: recipe.abv != null ? `${recipe.abv}%` : "—",
        kcal: 120,
        cover: "/cocktail-placeholder.svg",
      };
      const profile = buildCocktailNarrativeProfile(record);
      await persistCocktailProfiles([profile]);
    } catch (profileError) {
      console.warn("[agent] Narrative profile generation failed:", profileError);
    }
  }

  return {
    ...recipe,
    slug,
    saved: true,
    savedAsUser,
    viewUrl: `/recetas/${slug}`,
    message: savedAsUser
      ? "Receta guardada en tu cuenta y publicada en el recetario."
      : "Receta publicada en el recetario.",
  };
}
