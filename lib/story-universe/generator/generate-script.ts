import { generateStoryAiText, shouldUseStoryAi } from "../ai/lazy-provider";
import { parseJsonObject } from "@/lib/recipes/parse";
import type { StoryDraft, StoryScriptPayload } from "../types";
import { buildMockScript } from "./mock-script";

export function buildScriptPrompt(story: StoryDraft): string {
  return `Escribe guion original para animación 10-18 minutos (3 actos). Historia: ${story.title}.
Logline: ${story.logline}
Cóctel símbolo: ${story.cocktailReference}
Personajes: ${JSON.stringify(story.characterList)}
NO copies obras existentes. JSON únicamente:
{
  "synopsis": "...",
  "treatment": "...",
  "screenplay": {
    "acts": [
      { "act": 1, "beats": [{ "beatNumber": 1, "heading": "...", "action": "...", "dialogue": [{ "character": "...", "line": "..." }], "emotion": "..." }] },
      { "act": 2, "beats": [] },
      { "act": 3, "beats": [] }
    ]
  },
  "estimatedRuntimeMins": 14,
  "wordCount": 1800
}`;
}

function countWords(payload: StoryScriptPayload): number {
  let words = payload.synopsis.split(/\s+/).length + payload.treatment.split(/\s+/).length;
  for (const act of payload.screenplay.acts) {
    for (const beat of act.beats) {
      words += beat.action.split(/\s+/).length;
      for (const d of beat.dialogue ?? []) words += d.line.split(/\s+/).length;
    }
  }
  return words;
}

function parseScript(raw: Record<string, unknown>): StoryScriptPayload | null {
  try {
    const payload = {
      synopsis: String(raw.synopsis ?? ""),
      treatment: String(raw.treatment ?? ""),
      screenplay: raw.screenplay as StoryScriptPayload["screenplay"],
      estimatedRuntimeMins: Number(raw.estimatedRuntimeMins ?? 14),
      wordCount: Number(raw.wordCount ?? 0),
    };
    payload.wordCount = countWords(payload);
    payload.estimatedRuntimeMins = Math.round(payload.wordCount / 130);
    return payload;
  } catch {
    return null;
  }
}

export async function generateStoryScript(story: StoryDraft, useAi?: boolean): Promise<StoryScriptPayload> {
  if (shouldUseStoryAi(useAi)) {
    try {
      const text = await generateStoryAiText(buildScriptPrompt(story), { maxTokens: 4000 });
      const parsed = parseJsonObject(text);
      const script = parsed ? parseScript(parsed) : null;
      if (script && script.wordCount >= 800) return script;
    } catch {
      /* fallback */
    }
  }
  return buildMockScript(story);
}
