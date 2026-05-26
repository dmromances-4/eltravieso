import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ai from "@/lib/ai/provider";

type Ingredient = { name: string; amount: string };

type ParsedRecipe = {
  title?: string;
  name?: string;
  summary?: string;
  description?: string;
  method?: string;
  instructions?: string;
  ingredients?: any;
  items?: any;
  abv?: number | string;
  cost?: number | string;
  slug?: string;
  tasting?: string;
  imageUrl?: string;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function parseIngredientList(value: any): Ingredient[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          const parts = item.split(/\s+-\s+|:\s+|\s{2,}/).map((part) => part.trim()).filter(Boolean);
          return {
            name: parts[1] ?? parts[0],
            amount: parts[1] ? parts[0] : "—",
          };
        }

        if (typeof item === "object") {
          return {
            name: String(item.name ?? item.label ?? item.ingredient ?? item.product ?? "Ingrediente").trim(),
            amount: String(item.amount ?? item.quantity ?? item.value ?? "—").trim(),
          };
        }

        return { name: String(item), amount: "—" };
      })
      .filter((ingredient) => ingredient.name);
  }

  if (typeof value === "object") {
    return Object.entries(value).map(([key, val]) => ({
      name: String(key).trim(),
      amount: String((val as any)?.amount ?? (val as any)?.quantity ?? val ?? "—").trim(),
    }));
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,|;|\|\|/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/\s+-\s+|:\s+|\s{2,}/).map((part) => part.trim()).filter(Boolean);
        return {
          name: parts[1] ?? parts[0],
          amount: parts[1] ? parts[0] : "—",
        };
      });
  }

  return [];
}

function parseJsonObject(text: string) {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  const candidate = start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;
  try {
    return JSON.parse(candidate) as ParsedRecipe;
  } catch {
    return null;
  }
}

function parseNumber(value: any) {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const promptText = String(body.prompt || "").trim();

    if (!promptText) {
      return NextResponse.json({ message: "Debes proporcionar un texto para generar la receta." }, { status: 400 });
    }

    const prompt = `Eres un desarrollador de recetas de cocteles para una vermutería premium en español. Recibe este encargo y responde únicamente con un JSON válido sin explicaciones adicionales. El JSON debe tener las claves: title, summary, ingredients, method, abv, cost y slug. ingredients debe ser una lista de objetos con name y amount. Si no conoces abv o cost, usa null. Contexto: ${promptText}`;

    const textRes = await ai.generateText(prompt, { maxTokens: 700 });
    const parsed = parseJsonObject(textRes.text) ?? {};

    const title = String(parsed.title ?? parsed.name ?? `Cóctel de ${promptText.split(",")[0] || "vermut"}`).trim();
    const summary = String(parsed.summary ?? parsed.description ?? "Receta generada por IA.").trim();
    const method = String(parsed.method ?? parsed.instructions ?? textRes.text).trim();
    const ingredients = parseIngredientList(parsed.ingredients ?? parsed.items ?? []);
    const abv = parseNumber(parsed.abv);
    const cost = parseNumber(parsed.cost);
    const requestedSlug = String(parsed.slug || slugify(title) || `coctel-${Date.now()}`).trim();
    const slug = await ensureUniqueSlug(requestedSlug);

    const savedRecipe = await (async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) return null;

      const recipe = await prisma.recipe.create({
        data: {
          title,
          slug,
          summary,
          ingredients: JSON.stringify(ingredients),
          method,
          authorId: session.user.id,
        },
      });

      await prisma.technicalSheet.create({
        data: {
          recipeId: recipe.id,
          costCents: cost != null ? Math.round(cost * 100) : null,
          abv: abv ?? undefined,
          tasting: parsed.tasting ?? summary,
          imageUrl: parsed.imageUrl ?? null,
        },
      });

      return recipe;
    })();

    return NextResponse.json({
      title,
      summary,
      ingredients,
      method,
      abv,
      cost,
      slug,
      saved: Boolean(savedRecipe),
      message: savedRecipe ? "Receta guardada en la base de datos." : "Receta generada sin guardarse; inicia sesión para guardarla.",
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Error al generar la receta." }, { status: 500 });
  }
}
