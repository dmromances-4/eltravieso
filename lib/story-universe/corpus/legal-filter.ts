import type { ChunkExtraction } from "../types";

const MAX_QUOTE_WORDS = 15;
const MAX_LONG_FIELD_CHARS = 280;

function longestPhrase(text: string): number {
  return text.split(/[.!?]+/).reduce((max, s) => {
    const w = s.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(max, w);
  }, 0);
}

function ngramOverlap(a: string, b: string, n = 5): number {
  const wordsA = a.toLowerCase().split(/\s+/).filter(Boolean);
  const wordsB = b.toLowerCase().split(/\s+/).filter(Boolean);
  if (wordsA.length < n || wordsB.length < n) return 0;

  const setB = new Set<string>();
  for (let i = 0; i <= wordsB.length - n; i += 1) {
    setB.add(wordsB.slice(i, i + n).join(" "));
  }

  let hits = 0;
  let total = 0;
  for (let i = 0; i <= wordsA.length - n; i += 1) {
    total += 1;
    if (setB.has(wordsA.slice(i, i + n).join(" "))) hits += 1;
  }
  return total === 0 ? 0 : hits / total;
}

function collectStrings(obj: unknown): string[] {
  if (typeof obj === "string") return [obj];
  if (Array.isArray(obj)) return obj.flatMap(collectStrings);
  if (obj && typeof obj === "object") {
    return Object.values(obj as Record<string, unknown>).flatMap(collectStrings);
  }
  return [];
}

export type LegalFilterResult = {
  passed: boolean;
  reasons: string[];
};

export function filterExtractionLegality(
  extraction: ChunkExtraction,
  sourceText: string,
): LegalFilterResult {
  const reasons: string[] = [];
  const allStrings = collectStrings(extraction);

  for (const value of allStrings) {
    if (longestPhrase(value) > MAX_QUOTE_WORDS) {
      reasons.push(`Campo con frase demasiado larga (>${MAX_QUOTE_WORDS} palabras)`);
      break;
    }
  }

  for (const value of allStrings) {
    if (value.length > MAX_LONG_FIELD_CHARS) {
      reasons.push("Campo excede longitud máxima permitida");
      break;
    }
  }

  const overlap = ngramOverlap(allStrings.join(" "), sourceText, 6);
  if (overlap > 0.35) {
    reasons.push(`Alta similitud n-gram con texto fuente (${(overlap * 100).toFixed(0)}%)`);
  }

  return { passed: reasons.length === 0, reasons };
}

export function sanitizeExtractionStrings(extraction: ChunkExtraction): ChunkExtraction {
  const trimArr = (arr: string[]) =>
    arr.map((s) => s.trim().slice(0, MAX_LONG_FIELD_CHARS)).filter(Boolean);

  return {
    ...extraction,
    themes: trimArr(extraction.themes),
    subthemes: trimArr(extraction.subthemes),
    emotions: trimArr(extraction.emotions),
    scenarios: trimArr(extraction.scenarios),
    conflicts: trimArr(extraction.conflicts),
    relationships: trimArr(extraction.relationships),
    symbols: trimArr(extraction.symbols),
    recurringObjects: trimArr(extraction.recurringObjects),
    archetypes: trimArr(extraction.archetypes),
    dialoguePatterns: trimArr(extraction.dialoguePatterns),
    narrativeStructures: trimArr(extraction.narrativeStructures),
    narrativeRhythms: trimArr(extraction.narrativeRhythms),
    emotionalTone: extraction.emotionalTone.trim().slice(0, 120),
    endingTypes: trimArr(extraction.endingTypes),
    characterTypes: trimArr(extraction.characterTypes),
    motivations: trimArr(extraction.motivations),
    failures: trimArr(extraction.failures),
    desires: trimArr(extraction.desires),
    obsessions: trimArr(extraction.obsessions),
  };
}
