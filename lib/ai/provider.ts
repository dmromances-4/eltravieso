import type { AiTextProvider } from "@/lib/ai/availability";
import { resolveTextProvider } from "@/lib/ai/availability";
import { readEnvKey } from "@/lib/recipes/cover-env";
import { withSentrySpan } from "@/lib/observability/sentry-span";

type GoogleGenAI = any;

import type { AppLocale } from "@/i18n/routing";

// ─── Types ────────────────────────────────────────────────────────────
type TextResponse = { text: string };
type ImageResponse = { url: string };
type GenerateTextOptions = { maxTokens?: number; locale?: AppLocale };

// ─── Provider Resolution ──────────────────────────────────────────────
// Priority order: gemini → groq → openai → huggingface
// For images:     gemini → openai → huggingface

type TextProvider = "gemini" | "groq" | "openai" | "huggingface";
type ImageProvider = "gemini" | "openai" | "huggingface";

async function getOpenAIClient(apiKey: string, baseURL?: string) {
  const { default: OpenAI } = await import("openai");
  return new OpenAI(baseURL ? { apiKey, baseURL } : { apiKey });
}

function detectTextProvider(): TextProvider {
  const resolved = resolveTextProvider();
  if (resolved) return resolved as AiTextProvider;
  throw new Error(
    "No hay proveedor de IA configurado. Añade GEMINI_API_KEY, GROQ_API_KEY, OPENAI_API_KEY o HUGGINGFACE_API_KEY en .env.local.",
  );
}

function detectImageProvider(): ImageProvider {
  const explicit = process.env.AI_IMAGE_PROVIDER?.toLowerCase();
  if (explicit && ["gemini", "openai", "huggingface"].includes(explicit)) {
    return explicit as ImageProvider;
  }
  if (readEnvKey("GEMINI_API_KEY")) return "gemini";
  if (readEnvKey("OPENAI_API_KEY")) return "openai";
  if (readEnvKey("HUGGINGFACE_API_KEY")) return "huggingface";
  return "gemini"; // default
}

// ─── Gemini (Google AI Studio — FREE) ─────────────────────────────────
// https://aistudio.google.com/ — No credit card required
// ~1,500 RPD, 15-30 RPM, 1M TPM on Flash models

let geminiClientCache: GoogleGenAI | null = null;
let geminiClientKey: string | null = null;

async function getGeminiClient(): Promise<GoogleGenAI> {
  const apiKey = readEnvKey("GEMINI_API_KEY");
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY. Get a free key at https://aistudio.google.com/");
  if (geminiClientCache && geminiClientKey === apiKey) return geminiClientCache;
  const { GoogleGenAI } = await import("@google/genai");
  geminiClientCache = new GoogleGenAI({ apiKey });
  geminiClientKey = apiKey;
  return geminiClientCache;
}

async function geminiGenerateText(prompt: string, opts: { maxTokens?: number } = {}): Promise<TextResponse> {
  const client = await getGeminiClient();
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      maxOutputTokens: opts.maxTokens ?? 700,
    },
  });

  const text = response.text ?? "";
  return { text };
}

async function geminiGenerateImage(prompt: string): Promise<ImageResponse> {
  const client = await getGeminiClient();
  const imagenModel = process.env.GEMINI_IMAGE_MODEL ?? "imagen-4.0-fast-generate-001";

  try {
    const response = await client.models.generateImages({
      model: imagenModel,
      prompt,
      config: {
        numberOfImages: 1,
      },
    });

    const imageBytes = response?.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) {
      throw new Error("Gemini image generation returned no image data.");
    }

    return { url: `data:image/png;base64,${imageBytes}` };
  } catch (imagenError: any) {
    const msg = imagenError?.message ?? String(imagenError);
    const useFlashImage =
      /paid plans|INVALID_ARGUMENT|404|not found/i.test(msg) ||
      process.env.GEMINI_IMAGE_MODEL?.includes("flash-image");
    if (!useFlashImage) throw imagenError;

    console.warn(`[AI] Imagen unavailable (${msg.slice(0, 80)}…). Trying gemini-2.5-flash-image…`);

    const flashModel = process.env.GEMINI_FLASH_IMAGE_MODEL ?? "gemini-2.5-flash-image";
    const response = await client.models.generateContent({
      model: flashModel,
      contents: prompt,
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const inline = parts.find((part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData?.data);
    if (!inline?.inlineData?.data) {
      throw new Error("Gemini flash-image returned no image data.");
    }

    const mime = inline.inlineData.mimeType ?? "image/png";
    return { url: `data:${mime};base64,${inline.inlineData.data}` };
  }
}

// ─── Groq (FREE — ultra-fast LPU inference) ───────────────────────────
// https://console.groq.com — No credit card required
// ~30 RPM, ~14,400 RPD, uses OpenAI-compatible API

async function groqGenerateText(prompt: string, opts: { maxTokens?: number } = {}): Promise<TextResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY. Get a free key at https://console.groq.com");
  const client = await getOpenAIClient(apiKey, "https://api.groq.com/openai/v1");

  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    max_tokens: opts.maxTokens ?? 700,
  } as any);

  const text = response.choices?.[0]?.message?.content ?? "";
  return { text };
}

// ─── OpenAI (PAID) ────────────────────────────────────────────────────

async function openaiGenerateText(prompt: string, opts: { maxTokens?: number } = {}): Promise<TextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY.");

  const client = await getOpenAIClient(apiKey);
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: opts.maxTokens ?? 400,
  } as any);

  const text = response.choices?.[0]?.message?.content ?? "";
  return { text };
}

async function openaiGenerateImage(prompt: string): Promise<ImageResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY.");
  const client = await getOpenAIClient(apiKey);
  const r = await client.images.generate({ model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1", prompt });
  const url = r.data?.[0]?.url ?? (r.data?.[0]?.b64_json ? `data:image/png;base64,${r.data[0].b64_json}` : "");
  return { url };
}

async function openaiGenerateImageWithReference(prompt: string, referenceBuffer: Buffer): Promise<ImageResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY.");
  const { toFile } = await import("openai");
  const client = await getOpenAIClient(apiKey);
  const file = await toFile(referenceBuffer, "reference.png", { type: "image/png" });
  const r = await client.images.edit({
    model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
    image: file,
    prompt,
  });
  const url = r.data?.[0]?.url ?? (r.data?.[0]?.b64_json ? `data:image/png;base64,${r.data[0].b64_json}` : "");
  if (!url) throw new Error("OpenAI image edit returned no image data.");
  return { url };
}

async function geminiAnalyzeImage(imageBuffer: Buffer, prompt: string, mime = "image/jpeg"): Promise<TextResponse> {
  const client = await getGeminiClient();
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  const response = await client.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: mime, data: imageBuffer.toString("base64") } },
          { text: prompt },
        ],
      },
    ],
    config: {
      maxOutputTokens: 400,
    },
  });

  return { text: response.text ?? "" };
}

async function openaiAnalyzeImage(imageBuffer: Buffer, prompt: string, mime = "image/jpeg"): Promise<TextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY.");
  const client = await getOpenAIClient(apiKey);
  const dataUrl = `data:${mime};base64,${imageBuffer.toString("base64")}`;
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    max_tokens: 400,
  } as any);

  const text = response.choices?.[0]?.message?.content ?? "";
  return { text: typeof text === "string" ? text : JSON.stringify(text) };
}

// ─── HuggingFace (FREE — limited quality) ─────────────────────────────

async function huggingfaceGenerateText(prompt: string, opts: { maxTokens?: number } = {}): Promise<TextResponse> {
  const token = process.env.HUGGINGFACE_API_KEY;
  if (!token) throw new Error("Missing HUGGINGFACE_API_KEY.");

  const res = await fetch("https://api-inference.huggingface.co/models/gpt2", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: opts.maxTokens ?? 200 } }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HuggingFace text generation error: ${err}`);
  }

  const data = await res.json();
  const text = Array.isArray(data) ? (data[0]?.generated_text ?? "") : (data?.generated_text ?? JSON.stringify(data));
  return { text };
}

async function huggingfaceGenerateImage(prompt: string): Promise<ImageResponse> {
  const token = process.env.HUGGINGFACE_API_KEY;
  if (!token) throw new Error("Missing HUGGINGFACE_API_KEY.");

  const res = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: prompt }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HuggingFace image generation error: ${err}`);
  }

  const blob = await res.arrayBuffer();
  const b64 = Buffer.from(blob).toString("base64");
  return { url: `data:image/png;base64,${b64}` };
}

// ─── Text Generation Dispatch (with fallback chain) ───────────────────

type TextGeneratorFn = (_p: string, _o: GenerateTextOptions) => Promise<TextResponse>;

function withLocalePrompt(prompt: string, locale?: AppLocale): string {
  if (!locale || locale === "es") return prompt;
  const language = locale === "en" ? "English" : locale;
  return `Respond in ${language}. Keep brand names and proper nouns unchanged.\n\n${prompt}`;
}

const TEXT_GENERATORS: Record<TextProvider, TextGeneratorFn> = {
  gemini: geminiGenerateText,
  groq: groqGenerateText,
  openai: openaiGenerateText,
  huggingface: huggingfaceGenerateText,
};

const TEXT_FALLBACK_ORDER: TextProvider[] = ["gemini", "groq", "openai", "huggingface"];

export async function generateText(prompt: string, opts: GenerateTextOptions = {}): Promise<TextResponse> {
  const localizedPrompt = withLocalePrompt(prompt, opts.locale);

  return withSentrySpan(
    "ai.generate_text",
    "ai",
    async () => {
  // Development mock mode: return a predictable response when AI_MOCK=true
  if (process.env.AI_MOCK === "true") {
    return { text: `RESPUESTA_MOCK: Generación simulada para: ${localizedPrompt.slice(0, 120)}` };
  }

  const primary = detectTextProvider();

  // Try the primary provider first
  try {
    return await TEXT_GENERATORS[primary](localizedPrompt, opts);
  } catch (primaryError: any) {
    console.warn(`[AI] Primary provider "${primary}" failed: ${primaryError.message}. Trying fallbacks...`);
  }

  // Fallback chain: try each remaining provider in order
  for (const fallback of TEXT_FALLBACK_ORDER) {
    if (fallback === primary) continue;

    // Skip providers without API keys
    const keyMap: Record<TextProvider, string | undefined> = {
      gemini: process.env.GEMINI_API_KEY,
      groq: process.env.GROQ_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      huggingface: process.env.HUGGINGFACE_API_KEY,
    };
    if (!keyMap[fallback]) continue;

    try {
      console.log(`[AI] Trying fallback: "${fallback}"...`);
      return await TEXT_GENERATORS[fallback](localizedPrompt, opts);
    } catch (fallbackError: any) {
      console.warn(`[AI] Fallback "${fallback}" also failed: ${fallbackError.message}`);
    }
  }

  throw new Error(
    "All AI text providers failed. Configure at least one API key: GEMINI_API_KEY (free), GROQ_API_KEY (free), OPENAI_API_KEY, or HUGGINGFACE_API_KEY."
  );
    },
    { provider: detectTextProviderSafe() },
  );
}

function detectTextProviderSafe(): string {
  try {
    return detectTextProvider();
  } catch {
    return "none";
  }
}

// ─── Image Generation Dispatch (with fallback chain) ──────────────────

type ImageGeneratorFn = (p: string) => Promise<ImageResponse>;

const IMAGE_GENERATORS: Record<ImageProvider, ImageGeneratorFn> = {
  gemini: geminiGenerateImage,
  openai: openaiGenerateImage,
  huggingface: huggingfaceGenerateImage,
};

const IMAGE_FALLBACK_ORDER: ImageProvider[] = ["gemini", "openai", "huggingface"];

export async function generateImage(prompt: string): Promise<ImageResponse> {
  // Development mock mode: return a tiny placeholder PNG data URL
  if (process.env.AI_MOCK === "true") {
    const placeholder =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=";
    return { url: placeholder };
  }

  const primary = detectImageProvider();

  // Try the primary provider first
  try {
    return await IMAGE_GENERATORS[primary](prompt);
  } catch (primaryError: any) {
    console.warn(`[AI] Primary image provider "${primary}" failed: ${primaryError.message}. Trying fallbacks...`);
  }

  // Fallback chain
  for (const fallback of IMAGE_FALLBACK_ORDER) {
    if (fallback === primary) continue;

    const keyMap: Record<ImageProvider, string | undefined> = {
      gemini: readEnvKey("GEMINI_API_KEY"),
      openai: readEnvKey("OPENAI_API_KEY"),
      huggingface: readEnvKey("HUGGINGFACE_API_KEY"),
    };
    if (!keyMap[fallback]) continue;

    try {
      console.log(`[AI] Trying image fallback: "${fallback}"...`);
      return await IMAGE_GENERATORS[fallback](prompt);
    } catch (fallbackError: any) {
      console.warn(`[AI] Image fallback "${fallback}" also failed: ${fallbackError.message}`);
    }
  }

  throw new Error(
    "All AI image providers failed. Configure at least one API key: GEMINI_API_KEY (free), OPENAI_API_KEY, or HUGGINGFACE_API_KEY."
  );
}

const FREE_IMAGE_FALLBACK_ORDER: ImageProvider[] = ["gemini", "huggingface"];

/** Image generation for recipe covers — Gemini (free) then HuggingFace only. No paid APIs. */
export async function generateFreeImage(prompt: string): Promise<ImageResponse> {
  if (process.env.AI_MOCK === "true") {
    const placeholder =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=";
    return { url: placeholder };
  }

  for (const provider of FREE_IMAGE_FALLBACK_ORDER) {
    const keyMap: Record<ImageProvider, string | undefined> = {
      gemini: readEnvKey("GEMINI_API_KEY"),
      openai: readEnvKey("OPENAI_API_KEY"),
      huggingface: readEnvKey("HUGGINGFACE_API_KEY"),
    };
    if (!keyMap[provider]) continue;

    try {
      return await IMAGE_GENERATORS[provider](prompt);
    } catch (error: any) {
      console.warn(`[AI] Free image provider "${provider}" failed: ${error.message}`);
    }
  }

  throw new Error(
    "Portadas gratuitas requieren GEMINI_API_KEY (Imagen 4 en AI Studio) o HUGGINGFACE_API_KEY como fallback.",
  );
}

/** Vision for recipe covers — Gemini only (free tier). */
export async function analyzeImageForRecipeCover(
  imageBuffer: Buffer,
  prompt: string,
  mime = "image/jpeg",
): Promise<TextResponse> {
  if (process.env.AI_MOCK === "true") {
    return { text: "Mock reference: moody bar lighting, coupe glass, amber liquid, citrus garnish." };
  }

  if (!readEnvKey("GEMINI_API_KEY")) {
    throw new Error("Portadas con referencia requieren GEMINI_API_KEY (visión + Imagen, gratis en AI Studio).");
  }

  return geminiAnalyzeImage(imageBuffer, prompt, mime);
}

/** Describe a reference photo for recipe-aware image prompts (vision). */
export async function analyzeImageForRecipePrompt(
  imageBuffer: Buffer,
  prompt: string,
  mime = "image/jpeg",
): Promise<TextResponse> {
  if (process.env.AI_MOCK === "true") {
    return { text: "Mock reference: moody bar lighting, coupe glass, amber liquid, citrus garnish." };
  }

  if (readEnvKey("GEMINI_API_KEY")) {
    try {
      return await geminiAnalyzeImage(imageBuffer, prompt, mime);
    } catch (error: any) {
      console.warn(`[AI] Gemini vision failed: ${error.message}`);
    }
  }

  if (readEnvKey("OPENAI_API_KEY")) {
    return openaiAnalyzeImage(imageBuffer, prompt, mime);
  }

  throw new Error("Vision analysis requires GEMINI_API_KEY or OPENAI_API_KEY.");
}

/** Generate image using a reference photo (OpenAI edit, paid). Not used by recipe cover pipeline. */
export async function generateImageWithReference(prompt: string, referenceBuffer: Buffer): Promise<ImageResponse> {
  if (process.env.AI_MOCK === "true") {
    return generateImage(prompt);
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      return await openaiGenerateImageWithReference(prompt, referenceBuffer);
    } catch (error: any) {
      console.warn(`[AI] OpenAI reference edit failed: ${error.message}. Falling back to text-only.`);
    }
  }

  return generateImage(prompt);
}

const aiProvider = {
  generateText,
  generateImage,
  generateFreeImage,
  analyzeImageForRecipePrompt,
  analyzeImageForRecipeCover,
  generateImageWithReference,
};
export default aiProvider;
