import { NextResponse } from "next/server";
import ai from "@/lib/ai/provider";

type ReqBody = { baseRecipe?: string };
type Ingredient = { name: string; amount: string };

function parseJsonObject(text: string) {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  const candidate = start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function parseIngredients(value: any): Ingredient[] {
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
            name: String(item.name ?? item.label ?? item.ingredient ?? "Ingrediente").trim(),
            amount: String(item.amount ?? item.quantity ?? "—").trim(),
          };
        }

        return { name: String(item), amount: "—" };
      })
      .filter((ingredient) => ingredient.name);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,|;|\|\|/)
      .map((row) => row.trim())
      .filter(Boolean)
      .map((row) => {
        const parts = row.split(/\s+-\s+|:\s+|\s{2,}/).map((part) => part.trim()).filter(Boolean);
        return {
          name: parts[1] ?? parts[0],
          amount: parts[1] ? parts[0] : "—",
        };
      });
  }

  if (typeof value === "object") {
    return Object.entries(value).map(([key, val]) => ({
      name: String(key).trim(),
      amount: String(val ?? "—").trim(),
    }));
  }

  return [];
}

function buildIngredients(base: string): Ingredient[] {
  return base
    .split(/[\n,]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((name) => ({ name, amount: "—" }));
}

async function uploadSupabaseImage(imageUrl: string, title: string): Promise<string | null> {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET ?? "tech-sheets";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  try {
    let imageBuffer: Buffer | null = null;

    if (imageUrl.startsWith("data:")) {
      const comma = imageUrl.indexOf(",");
      const b64 = imageUrl.slice(comma + 1);
      imageBuffer = Buffer.from(b64, "base64");
    } else {
      const fetched = await fetch(imageUrl);
      const ab = await fetched.arrayBuffer();
      imageBuffer = Buffer.from(ab);
    }

    const filename = `images/${Date.now()}-${title.replace(/[^a-zA-Z0-9-_.]/g, "_")}.png`;
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${filename}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "image/png",
      },
      body: imageBuffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("Supabase upload failed:", errText);
      return null;
    }

    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${filename}`;
  } catch (uploadErr) {
    console.error("Error uploading image to Supabase:", uploadErr);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body: ReqBody = await request.json();
    const base = (body.baseRecipe || "").trim();

    if (!base) {
      return NextResponse.json({ message: "baseRecipe is required" }, { status: 400 });
    }

    const baseIngredients = buildIngredients(base);
    const prompt = `Eres un bartender creativo de una vermutería premium en español. Crea una ficha técnica de cóctel basada en estos ingredientes base: ${base}. Responde únicamente con un JSON válido y sin explicaciones adicionales. El JSON debe incluir:\n- title: nombre corto del cóctel\n- summary: breve descripción de concepto\n- ingredients: lista de objetos con name y amount\n- method: pasos de preparación\n- organolepticDesc: notas de cata\n- cost: coste estimado en EUR como número\n- abv: graduación alcohólica aproximada como número\nMantén un tono elegante, directo y adaptado a una barra premium.`;

    const textRes = await ai.generateText(prompt, { maxTokens: 600 });
    const parsed = parseJsonObject(textRes.text) ?? {};

    const ingredients = parseIngredients(parsed.ingredients) || baseIngredients;
    const title = String(parsed.title ?? parsed.name ?? baseIngredients[0]?.name ?? "Cóctel Premium").trim();
    const summary = String(parsed.summary ?? parsed.description ?? "Ficha técnica generada por IA.").trim();
    const method = String(parsed.method ?? parsed.instructions ?? textRes.text).trim();
    const organolepticDesc = String(parsed.organolepticDesc ?? parsed.tasting ?? "").trim();
    const cost = parsed.cost != null ? Number(parsed.cost) : null;
    const abv = parsed.abv != null ? Number(parsed.abv) : null;

    const imagePrompt = `Fotografía elegante de un cóctel premium llamado ${title}, preparado con ${base}. Ambiente de barra moderna, iluminación cálida y enfoque altísimo.`;
    const imageRes = await ai.generateImage(imagePrompt);
    let finalImageUrl: string | null = imageRes.url ?? null;

    if (finalImageUrl) {
      const uploaded = await uploadSupabaseImage(finalImageUrl, title);
      if (uploaded) finalImageUrl = uploaded;
    }

    return NextResponse.json({
      title,
      summary,
      ingredients,
      method,
      organolepticDesc,
      cost: Number.isFinite(cost) ? cost : null,
      abv: Number.isFinite(abv) ? abv : null,
      imageUrl: finalImageUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || String(err) }, { status: 500 });
  }
}
