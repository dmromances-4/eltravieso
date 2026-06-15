#!/usr/bin/env tsx
/**
 * Valida claves de portadas (Gemini, Pexels, Unsplash) con ping real a cada API.
 * Uso: npm run check:recipe-covers
 */
import { config } from "dotenv";
import { resolve } from "path";
import { geminiKeyFormatHint, readEnvKey } from "@/lib/recipes/cover-env";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

type CheckResult = { name: string; status: "ok" | "warn" | "fail" | "skip"; detail: string };

async function checkGemini(): Promise<CheckResult> {
  const key = readEnvKey("GEMINI_API_KEY");
  if (!key) {
    return {
      name: "GEMINI_API_KEY",
      status: "fail",
      detail: "Ausente o vacía en .env.local. Crea una en https://aistudio.google.com/",
    };
  }

  const hint = geminiKeyFormatHint(key);
  if (hint) {
    return { name: "GEMINI_API_KEY", status: "warn", detail: hint };
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const client = new GoogleGenAI({ apiKey: key });
    const imageModel = process.env.GEMINI_IMAGE_MODEL ?? "imagen-4.0-fast-generate-001";
    const response = await client.models.generateImages({
      model: imageModel,
      prompt: "Test cocktail photo",
      config: { numberOfImages: 1 },
    });
    const bytes = response?.generatedImages?.[0]?.image?.imageBytes;
    if (bytes) {
      return {
        name: "GEMINI_API_KEY",
        status: "ok",
        detail: `Clave válida (${imageModel}, imagen de prueba OK).`,
      };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // Fallback: al menos listar modelos
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.status === 200) {
        return {
          name: "GEMINI_API_KEY",
          status: "warn",
          detail: `API responde pero Imagen falló: ${msg.slice(0, 100)}`,
        };
      }
    } catch {
      /* fall through */
    }
    return {
      name: "GEMINI_API_KEY",
      status: "fail",
      detail: `Imagen rechazada: ${msg.slice(0, 150)}`,
    };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (res.status === 200) {
      return { name: "GEMINI_API_KEY", status: "ok", detail: "Clave válida (API responde 200)." };
    }
    if (res.status === 400 || res.status === 403) {
      const body = await res.text();
      const snippet = body.slice(0, 120).replace(/\s+/g, " ");
      return {
        name: "GEMINI_API_KEY",
        status: "fail",
        detail: `Rechazada (${res.status}). ${snippet || "Revisa la clave en AI Studio."}`,
      };
    }
    return { name: "GEMINI_API_KEY", status: "warn", detail: `Respuesta inesperada HTTP ${res.status}.` };
  } catch (error) {
    return {
      name: "GEMINI_API_KEY",
      status: "warn",
      detail: `No se pudo verificar en red: ${error instanceof Error ? error.message : error}`,
    };
  }
}

async function checkPexels(): Promise<CheckResult> {
  const key = readEnvKey("PEXELS_API_KEY");
  if (!key) {
    return {
      name: "PEXELS_API_KEY",
      status: "warn",
      detail: "Opcional pero recomendada. https://www.pexels.com/api/",
    };
  }

  try {
    const res = await fetch("https://api.pexels.com/v1/search?query=cocktail&per_page=1", {
      headers: { Authorization: key },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 200) {
      return { name: "PEXELS_API_KEY", status: "ok", detail: "Clave válida (sin prefijo Bearer)." };
    }
    if (res.status === 401) {
      return {
        name: "PEXELS_API_KEY",
        status: "fail",
        detail: "401 Unauthorized — clave incorrecta o revocada.",
      };
    }
    return { name: "PEXELS_API_KEY", status: "fail", detail: `HTTP ${res.status}.` };
  } catch (error) {
    return {
      name: "PEXELS_API_KEY",
      status: "warn",
      detail: `Error de red: ${error instanceof Error ? error.message : error}`,
    };
  }
}

async function checkUnsplash(): Promise<CheckResult> {
  const key = readEnvKey("UNSPLASH_ACCESS_KEY");
  if (!key) {
    return {
      name: "UNSPLASH_ACCESS_KEY",
      status: "warn",
      detail: "Opcional. https://unsplash.com/developers",
    };
  }

  try {
    const res = await fetch("https://api.unsplash.com/photos/random", {
      headers: { Authorization: `Client-ID ${key}` },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 200) {
      return { name: "UNSPLASH_ACCESS_KEY", status: "ok", detail: "Access Key válida (Client-ID …)." };
    }
    if (res.status === 401) {
      return {
        name: "UNSPLASH_ACCESS_KEY",
        status: "fail",
        detail: "401 Unauthorized — Access Key incorrecta.",
      };
    }
    return { name: "UNSPLASH_ACCESS_KEY", status: "fail", detail: `HTTP ${res.status}.` };
  } catch (error) {
    return {
      name: "UNSPLASH_ACCESS_KEY",
      status: "warn",
      detail: `Error de red: ${error instanceof Error ? error.message : error}`,
    };
  }
}

async function main() {
  console.log("\n=== Portadas de recetas — check claves ===\n");

  if (process.env.AI_MOCK === "true") {
    console.log("⚠ AI_MOCK=true — el batch usará SVG de marca, no Gemini/Imagen.\n");
  }

  const results = await Promise.all([checkGemini(), checkPexels(), checkUnsplash()]);
  let hasFail = false;

  for (const r of results) {
    const icon = r.status === "ok" ? "✓" : r.status === "warn" ? "○" : r.status === "skip" ? "-" : "✗";
    console.log(`${icon} ${r.name}: ${r.detail}`);
    if (r.status === "fail") hasFail = true;
  }

  const gemini = readEnvKey("GEMINI_API_KEY");
  const hasStock = Boolean(readEnvKey("PEXELS_API_KEY") || readEnvKey("UNSPLASH_ACCESS_KEY"));

  console.log("\nResumen:");
  if (!gemini) {
    console.log("  • Añade GEMINI_API_KEY=tu_clave en .env.local (sin comillas).");
    hasFail = true;
  }
  if (!hasStock) {
    console.log("  • Añade al menos PEXELS_API_KEY o UNSPLASH_ACCESS_KEY para stock gratuito.");
  }
  if (process.env.AI_MOCK === "true") {
    console.log("  • Pon AI_MOCK=false para generar fotos reales con Gemini.");
  }

  console.log("");
  process.exit(hasFail ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
