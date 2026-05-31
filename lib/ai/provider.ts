import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { resolveTextProvider, type AiTextProvider } from "@/lib/ai/availability";

// ─── Types ────────────────────────────────────────────────────────────
type TextResponse = { text: string };
type ImageResponse = { url: string };

// ─── Provider Resolution ──────────────────────────────────────────────
// Priority order: gemini → groq → openai → huggingface
// For images:     gemini → openai → huggingface

type TextProvider = "gemini" | "groq" | "openai" | "huggingface";
type ImageProvider = "gemini" | "openai" | "huggingface";

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
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.HUGGINGFACE_API_KEY) return "huggingface";
  return "gemini"; // default
}

// ─── Gemini (Google AI Studio — FREE) ─────────────────────────────────
// https://aistudio.google.com/ — No credit card required
// ~1,500 RPD, 15-30 RPM, 1M TPM on Flash models

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY. Get a free key at https://aistudio.google.com/");
  return new GoogleGenAI({ apiKey });
}

async function geminiGenerateText(prompt: string, opts: { maxTokens?: number } = {}): Promise<TextResponse> {
  const client = getGeminiClient();
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
  const client = getGeminiClient();
  const model = process.env.GEMINI_IMAGE_MODEL ?? "imagen-3.0-generate-001";

  const response = await client.models.generateImages({
    model,
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
}

// ─── Groq (FREE — ultra-fast LPU inference) ───────────────────────────
// https://console.groq.com — No credit card required
// ~30 RPM, ~14,400 RPD, uses OpenAI-compatible API

async function groqGenerateText(prompt: string, opts: { maxTokens?: number } = {}): Promise<TextResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY. Get a free key at https://console.groq.com");

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

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

  const client = new OpenAI({ apiKey });
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

  const client = new OpenAI({ apiKey });
  const r = await client.images.generate({
    model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
    prompt,
  });
  const url = r.data?.[0]?.url ?? (r.data?.[0]?.b64_json ? `data:image/png;base64,${r.data[0].b64_json}` : "");
  return { url };
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

type TextGeneratorFn = (_p: string, _o: { maxTokens?: number }) => Promise<TextResponse>;

const TEXT_GENERATORS: Record<TextProvider, TextGeneratorFn> = {
  gemini: geminiGenerateText,
  groq: groqGenerateText,
  openai: openaiGenerateText,
  huggingface: huggingfaceGenerateText,
};

const TEXT_FALLBACK_ORDER: TextProvider[] = ["gemini", "groq", "openai", "huggingface"];

export async function generateText(prompt: string, opts: { maxTokens?: number } = {}): Promise<TextResponse> {
  const primary = detectTextProvider();

  // Try the primary provider first
  try {
    return await TEXT_GENERATORS[primary](prompt, opts);
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
      return await TEXT_GENERATORS[fallback](prompt, opts);
    } catch (fallbackError: any) {
      console.warn(`[AI] Fallback "${fallback}" also failed: ${fallbackError.message}`);
    }
  }

  throw new Error(
    "All AI text providers failed. Configure at least one API key: GEMINI_API_KEY (free), GROQ_API_KEY (free), OPENAI_API_KEY, or HUGGINGFACE_API_KEY."
  );
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
      gemini: process.env.GEMINI_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      huggingface: process.env.HUGGINGFACE_API_KEY,
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

const aiProvider = { generateText, generateImage };
export default aiProvider;
