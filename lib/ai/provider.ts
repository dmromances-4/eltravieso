import OpenAI from "openai";

type TextResponse = { text: string };
type ImageResponse = { url: string };

const provider = process.env.AI_PROVIDER ?? (process.env.OPENAI_API_KEY ? "openai" : "huggingface");

async function huggingfaceGenerateText(prompt: string, opts: { maxTokens?: number } = {}): Promise<TextResponse> {
  const token = process.env.HUGGINGFACE_API_KEY;
  if (!token) throw new Error("Missing HUGGINGFACE_API_KEY for huggingface provider");

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
  if (!token) throw new Error("Missing HUGGINGFACE_API_KEY for huggingface provider");

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

async function openaiGenerateText(prompt: string, opts: { maxTokens?: number } = {}): Promise<TextResponse> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    if (process.env.HUGGINGFACE_API_KEY) {
      return huggingfaceGenerateText(prompt, opts);
    }
    throw new Error("Missing OPENAI_API_KEY and HUGGINGFACE_API_KEY.");
  }

  const client = new OpenAI({ apiKey: openaiKey });
  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: opts.maxTokens ?? 400,
    } as any);

    const text = response.choices?.[0]?.message?.content ?? "";
    return { text };
  } catch (error: any) {
    if (process.env.HUGGINGFACE_API_KEY) {
      return huggingfaceGenerateText(prompt, opts);
    }
    throw error;
  }
}

async function openaiGenerateImage(prompt: string): Promise<ImageResponse> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    if (process.env.HUGGINGFACE_API_KEY) {
      return huggingfaceGenerateImage(prompt);
    }
    throw new Error("Missing OPENAI_API_KEY and HUGGINGFACE_API_KEY.");
  }

  const client = new OpenAI({ apiKey: openaiKey });
  try {
    const r = await client.images.generate({ model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1", prompt });
    const url = r.data?.[0]?.url ?? r.data?.[0]?.b64_json ? `data:image/png;base64,${r.data[0].b64_json}` : "";
    return { url };
  } catch (error: any) {
    if (process.env.HUGGINGFACE_API_KEY) {
      return huggingfaceGenerateImage(prompt);
    }
    throw error;
  }
}

export async function generateText(prompt: string, opts: { maxTokens?: number } = {}): Promise<TextResponse> {
  if (provider === "huggingface") {
    return huggingfaceGenerateText(prompt, opts);
  }
  return openaiGenerateText(prompt, opts);
}

export async function generateImage(prompt: string): Promise<ImageResponse> {
  if (provider === "huggingface") {
    return huggingfaceGenerateImage(prompt);
  }
  return openaiGenerateImage(prompt);
}

export default { generateText, generateImage };
