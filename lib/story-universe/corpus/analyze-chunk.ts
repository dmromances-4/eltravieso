import { generateStoryAiText, shouldUseStoryAi } from "../ai/lazy-provider";
import { parseJsonObject } from "@/lib/recipes/parse";
import type { ChunkExtraction } from "../types";
import { filterExtractionLegality, sanitizeExtractionStrings } from "./legal-filter";

export function buildChunkAnalysisPrompt(input: {
  chunkId: string;
  sourceTitle: string;
  sourceAuthor: string;
  text: string;
}): string {
  return `Eres un analista literario. Analiza el siguiente fragmento SOLO para extraer patrones abstractos.
NUNCA copies frases del texto. NUNCA cites más de 8 palabras seguidas. NUNCA reproduzcas párrafos.
Responde ÚNICAMENTE con JSON válido (sin markdown).

Fragmento de "${input.sourceTitle}" (${input.sourceAuthor}), chunk ${input.chunkId}:
---
${input.text.slice(0, 4500)}
---

JSON requerido:
{
  "chunkId": "${input.chunkId}",
  "sourceTitle": "${input.sourceTitle.replace(/"/g, "'")}",
  "sourceAuthor": "${input.sourceAuthor.replace(/"/g, "'")}",
  "themes": ["tema abstracto 1"],
  "subthemes": ["..."],
  "emotions": ["..."],
  "scenarios": ["..."],
  "conflicts": ["..."],
  "relationships": ["..."],
  "symbols": ["..."],
  "recurringObjects": ["..."],
  "archetypes": ["..."],
  "dialoguePatterns": ["patrón de diálogo, no citas"],
  "narrativeStructures": ["..."],
  "narrativeRhythms": ["..."],
  "emotionalTone": "tono en una frase corta original",
  "endingTypes": ["..."],
  "characterTypes": ["..."],
  "motivations": ["..."],
  "failures": ["..."],
  "desires": ["..."],
  "obsessions": ["..."]
}`;
}

function parseExtraction(raw: Record<string, unknown>, chunkId: string): ChunkExtraction | null {
  const strArr = (key: string): string[] => {
    const v = raw[key];
    if (!Array.isArray(v)) return [];
    return v.map((x) => String(x).trim()).filter(Boolean);
  };

  return {
    chunkId: String(raw.chunkId ?? chunkId),
    sourceTitle: String(raw.sourceTitle ?? ""),
    sourceAuthor: String(raw.sourceAuthor ?? ""),
    themes: strArr("themes"),
    subthemes: strArr("subthemes"),
    emotions: strArr("emotions"),
    scenarios: strArr("scenarios"),
    conflicts: strArr("conflicts"),
    relationships: strArr("relationships"),
    symbols: strArr("symbols"),
    recurringObjects: strArr("recurringObjects"),
    archetypes: strArr("archetypes"),
    dialoguePatterns: strArr("dialoguePatterns"),
    narrativeStructures: strArr("narrativeStructures"),
    narrativeRhythms: strArr("narrativeRhythms"),
    emotionalTone: String(raw.emotionalTone ?? ""),
    endingTypes: strArr("endingTypes"),
    characterTypes: strArr("characterTypes"),
    motivations: strArr("motivations"),
    failures: strArr("failures"),
    desires: strArr("desires"),
    obsessions: strArr("obsessions"),
  };
}

export function buildMockExtraction(input: {
  chunkId: string;
  sourceTitle: string;
  sourceAuthor: string;
}): ChunkExtraction {
  const bar = input.sourceTitle.toLowerCase().includes("drink");
  return {
    chunkId: input.chunkId,
    sourceTitle: input.sourceTitle,
    sourceAuthor: input.sourceAuthor,
    themes: bar ? ["alcohol", "soledad urbana", "supervivencia"] : ["deseo", "fracaso romántico", "ciudad nocturna"],
    subthemes: ["taberna", "escritura", "apuestas"],
    emotions: ["melancolía", "cínico humor", "nostalgia"],
    scenarios: ["bar de barrio", "habitación alquilada", "calle de noche"],
    conflicts: ["auto-sabotaje", "deudas", "relaciones tóxicas"],
    relationships: ["amistad frágil", "amor imposible"],
    symbols: ["vaso vacío", "máquina de escribir", "neón"],
    recurringObjects: ["botella", "copa", "billete arrugado"],
    archetypes: ["poeta fracasado", "camarero filósofo", "apostador"],
    dialoguePatterns: ["respuestas secas", "monólogo interior breve"],
    narrativeStructures: ["anécdota circular", "tres actos mínimos"],
    narrativeRhythms: ["pausas largas", "final abrupto"],
    emotionalTone: "crudo y resignado con destellos de humor negro",
    endingTypes: ["sin redención", "ironía amarga"],
    characterTypes: ["anti-héroe entrañable"],
    motivations: ["escapar del aburrimiento", "buscar una señal"],
    failures: ["no sostener relaciones", "autodestrucción"],
    desires: ["ser visto", "un trago más"],
    obsessions: ["alcohol", "escritura", "mujeres"],
  };
}

export async function analyzeChunk(input: {
  chunkId: string;
  sourceTitle: string;
  sourceAuthor: string;
  text: string;
  useAi?: boolean;
}): Promise<{ extraction: ChunkExtraction; legal: { passed: boolean; reasons: string[] } }> {
  let extraction: ChunkExtraction;

  if (shouldUseStoryAi(input.useAi)) {
    try {
      const prompt = buildChunkAnalysisPrompt(input);
      const text = await generateStoryAiText(prompt, { maxTokens: 1200 });
      const parsed = parseJsonObject(text);
      if (!parsed) throw new Error("JSON inválido");
      extraction = sanitizeExtractionStrings(parseExtraction(parsed, input.chunkId)!);
    } catch {
      extraction = buildMockExtraction(input);
    }
  } else {
    extraction = buildMockExtraction(input);
  }

  const legal = filterExtractionLegality(extraction, input.text);
  return { extraction, legal };
}
