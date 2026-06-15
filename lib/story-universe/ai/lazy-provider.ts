import { isTextAiAvailable } from "@/lib/ai/availability";

export function shouldUseStoryAi(useAi?: boolean): boolean {
  return useAi !== false && isTextAiAvailable() && process.env.AI_MOCK !== "true";
}

export async function generateStoryAiText(
  prompt: string,
  opts: { maxTokens?: number } = {},
): Promise<string> {
  const { default: ai } = await import("@/lib/ai/provider");
  const { text } = await ai.generateText(prompt, opts);
  return text;
}
