export type AiTextProvider = "gemini" | "groq" | "openai" | "huggingface";
export type AiImageProvider = "gemini" | "openai" | "huggingface";

const TEXT_PROVIDERS: AiTextProvider[] = ["gemini", "groq", "openai", "huggingface"];
const IMAGE_PROVIDERS: AiImageProvider[] = ["gemini", "openai", "huggingface"];

function hasTextKey(provider: AiTextProvider): boolean {
  const map: Record<AiTextProvider, string | undefined> = {
    gemini: process.env.GEMINI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    huggingface: process.env.HUGGINGFACE_API_KEY,
  };
  return Boolean(map[provider]?.trim());
}

function hasImageKey(provider: AiImageProvider): boolean {
  const map: Record<AiImageProvider, string | undefined> = {
    gemini: process.env.GEMINI_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    huggingface: process.env.HUGGINGFACE_API_KEY,
  };
  return Boolean(map[provider]?.trim());
}

export function getConfiguredTextProviders(): AiTextProvider[] {
  return TEXT_PROVIDERS.filter(hasTextKey);
}

export function getConfiguredImageProviders(): AiImageProvider[] {
  return IMAGE_PROVIDERS.filter(hasImageKey);
}

export function isTextAiAvailable(): boolean {
  return getConfiguredTextProviders().length > 0;
}

export function isImageAiAvailable(): boolean {
  return getConfiguredImageProviders().length > 0;
}

export function resolveTextProvider(): AiTextProvider | null {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit && TEXT_PROVIDERS.includes(explicit as AiTextProvider) && hasTextKey(explicit as AiTextProvider)) {
    return explicit as AiTextProvider;
  }
  return getConfiguredTextProviders()[0] ?? null;
}

export function getAiStatus() {
  const textProviders = getConfiguredTextProviders();
  const imageProviders = getConfiguredImageProviders();
  const preferredText = resolveTextProvider();

  return {
    available: textProviders.length > 0,
    text: {
      available: textProviders.length > 0,
      providers: textProviders,
      preferred: preferredText,
      explicit: process.env.AI_PROVIDER ?? null,
    },
    image: {
      available: imageProviders.length > 0,
      providers: imageProviders,
      explicit: process.env.AI_IMAGE_PROVIDER ?? null,
    },
    agent: {
      path: "/api/ai/agent",
      page: "/pro/tech-generator",
      requiresAuthToSave: true,
    },
  };
}
