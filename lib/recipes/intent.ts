import ai from "@/lib/ai/provider";
import { parseJsonObject } from "@/lib/recipes/parse";

/**
 * Capa de "estudio de la petición": analiza el briefing del cliente antes de
 * generar la receta. Combina extractores deterministas (fiables para números y
 * palabras clave) con un análisis del LLM (matices), priorizando lo determinista.
 */

export type RequestKind = "single" | "batch";

export type Sweetness = "dulce" | "seco" | "amargo" | "acido" | "equilibrado";

export type EffectIntent = "fuerte" | "ligero" | "sin_alcohol" | "neutro";

export type DifficultyIntent = "facil" | "media" | "avanzada";

export interface RequestIntent {
  /** single = una copa; batch = volumen/evento (sangría, ponche, para N personas). */
  kind: RequestKind;
  /** Nº de comensales si se detecta ("para 40 personas"). */
  servings: number | null;
  /** Volumen total objetivo en litros si se detecta ("40 litros de sangría"). */
  volumeLiters: number | null;
  /** Perfil de sabor dominante solicitado. */
  sweetness: Sweetness;
  /** Intención de efecto: fuerte (emborracha), ligero (poca resaca), sin alcohol. */
  effect: EffectIntent;
  /** Dificultad deseada. */
  difficulty: DifficultyIntent;
  /** Tema/inspiración cultural si lo hay ("inspirado en Star Wars"). */
  theme: string | null;
  /** ABV objetivo aproximado en % (derivado del efecto, orientativo). */
  targetAbv: number | null;
  /** Etiquetas resultantes para clasificar la receta. */
  tags: string[];
  /** Resumen legible de cómo se ha interpretado la petición. */
  rationale: string;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const BATCH_KEYWORDS =
  /\b(sangria|sangr|ponche|punch|tinto de verano|clerico|clarea|jarra|barril|garrafa|fuente|batch|para (?:un|el) evento|boda|fiesta|catering)\b/;

/** "para 40 personas", "40 comensales", "40 pax", "40 invitados". */
function extractServings(text: string): number | null {
  const m = text.match(
    /\bpara\s+(\d{1,4})\s*(?:personas?|comensales?|invitad[oa]s?|pax|gente|amig[oa]s?)\b/,
  );
  if (m) return clampInt(Number(m[1]));
  const m2 = text.match(/\b(\d{1,4})\s*(?:personas?|comensales?|invitad[oa]s?|pax)\b/);
  return m2 ? clampInt(Number(m2[1])) : null;
}

/** "40 litros", "40 l", "40L", "0,75 litros", "5 cl" -> litros. */
function extractVolumeLiters(text: string): number | null {
  const liters = text.match(/\b(\d+(?:[.,]\d+)?)\s*(?:litros?|lts?\.?|l)\b/);
  if (liters) return clampVolume(parseFloat(liters[1].replace(",", ".")));
  const cl = text.match(/\b(\d+(?:[.,]\d+)?)\s*cl\b/);
  if (cl) return clampVolume(parseFloat(cl[1].replace(",", ".")) / 100);
  const ml = text.match(/\b(\d+(?:[.,]\d+)?)\s*ml\b/);
  if (ml) return clampVolume(parseFloat(ml[1].replace(",", ".")) / 1000);
  return null;
}

function clampInt(value: number): number | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.min(Math.round(value), 5000);
}

function clampVolume(value: number): number | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.min(Math.round(value * 100) / 100, 2000);
}

// Nota: los detectores usan RAÍCES (stems), por lo que llevan \b solo al inicio.
// Añadir \b al final impediría casar formas flexionadas ("emborrache", "ácido").
function detectSweetness(text: string): Sweetness | null {
  if (/\b(dulce|dulzon|azucarad|empalagos|goloso|sweet)/.test(text)) return "dulce";
  if (/\b(amarg|bitter)/.test(text)) return "amargo";
  if (/\b(acid|citric|fresc|refrescante|sour)/.test(text)) return "acido";
  if (/\b(seco|dry|poco dulce|nada dulce|sin azucar)/.test(text)) return "seco";
  return null;
}

function detectEffect(text: string): EffectIntent | null {
  if (/\b(sin alcohol|virgen|mocktail|0\.?0|cero alcohol|no alcoholico|para conducir)/.test(text))
    return "sin_alcohol";
  if (
    /\b(emborrach|fuerte|cargad|potent|que pegue|con mucho alcohol|subidon|para ir borrach|que suba)/.test(
      text,
    )
  )
    return "fuerte";
  if (
    /\b(sin resaca|no deje resaca|que no de resaca|ligero|suave|flojito|bajo en alcohol|poco alcohol|hidratant)/.test(
      text,
    )
  )
    return "ligero";
  return null;
}

function detectDifficulty(text: string): DifficultyIntent | null {
  if (/\b(facil|sencill|rapid|simple|sin complicacion|pocos ingredientes|express)/.test(text))
    return "facil";
  if (/\b(avanzad|complej|elaborad|sofisticad|tecnica|para profesional|signature|de autor)/.test(text))
    return "avanzada";
  return null;
}

/** ABV orientativo según efecto buscado. */
function abvForEffect(effect: EffectIntent): number | null {
  switch (effect) {
    case "fuerte":
      return 28;
    case "ligero":
      return 9;
    case "sin_alcohol":
      return 0;
    default:
      return null;
  }
}

/** Extrae un posible tema/inspiración ("inspirado en X", "estilo X", "temática X"). */
function extractTheme(rawText: string): string | null {
  const patterns = [
    /\binspirad[oa]\s+en\s+(.+)$/i,
    /\bbasad[oa]\s+en\s+(.+)$/i,
    /\btem[aá]tic[oa]\s+(?:de\s+)?(.+)$/i,
    /\bestilo\s+(.+)$/i,
    /\bque evoque\s+(.+)$/i,
    /\bhomenaje a\s+(.+)$/i,
  ];
  for (const re of patterns) {
    const m = rawText.match(re);
    if (m) {
      const theme = m[1]
        .replace(/[.,;].*$/, "")
        .replace(/\b(por favor|porfa|gracias)\b/i, "")
        .trim();
      if (theme.length >= 2 && theme.length <= 80) return theme;
    }
  }
  return null;
}

function buildTags(intent: Omit<RequestIntent, "tags" | "rationale">): string[] {
  const tags = new Set<string>();
  tags.add(intent.kind === "batch" ? "batch" : "individual");
  tags.add(intent.sweetness);
  if (intent.effect !== "neutro") tags.add(intent.effect);
  tags.add(intent.difficulty);
  if (intent.theme) tags.add("tematico");
  if (intent.volumeLiters) tags.add("gran-volumen");
  if (intent.servings && intent.servings >= 12) tags.add("evento");
  return [...tags];
}

/** Análisis 100% determinista (sin red). Es la base fiable. */
export function analyzeRequestHeuristic(promptText: string): RequestIntent {
  const text = normalize(promptText);

  const servings = extractServings(text);
  const volumeLiters = extractVolumeLiters(text);
  const isBatch =
    BATCH_KEYWORDS.test(text) ||
    (servings != null && servings >= 6) ||
    (volumeLiters != null && volumeLiters >= 2);

  const sweetness = detectSweetness(text) ?? "equilibrado";
  const effect = detectEffect(text) ?? "neutro";
  const difficulty =
    detectDifficulty(text) ?? (isBatch && (servings ?? 0) >= 20 ? "facil" : "media");
  const theme = extractTheme(promptText.trim());

  const base = {
    kind: (isBatch ? "batch" : "single") as RequestKind,
    servings,
    volumeLiters,
    sweetness,
    effect,
    difficulty,
    theme,
    targetAbv: abvForEffect(effect),
  };

  return {
    ...base,
    tags: buildTags(base),
    rationale: describeIntent(base),
  };
}

function describeIntent(i: Omit<RequestIntent, "tags" | "rationale">): string {
  const parts: string[] = [];
  parts.push(i.kind === "batch" ? "Preparación por volumen/evento" : "Cóctel individual");
  if (i.servings) parts.push(`${i.servings} personas`);
  if (i.volumeLiters) parts.push(`${i.volumeLiters} L totales`);
  if (i.sweetness !== "equilibrado") parts.push(`perfil ${i.sweetness}`);
  if (i.effect === "fuerte") parts.push("alta graduación");
  if (i.effect === "ligero") parts.push("baja graduación / suave");
  if (i.effect === "sin_alcohol") parts.push("sin alcohol");
  parts.push(`dificultad ${i.difficulty}`);
  if (i.theme) parts.push(`temática: ${i.theme}`);
  return parts.join(" · ");
}

const LLM_ANALYSIS_SCHEMA = `Devuelve SOLO un JSON válido (sin markdown) con esta forma:
{
  "kind": "single" | "batch",
  "servings": número o null,
  "volumeLiters": número o null,
  "sweetness": "dulce" | "seco" | "amargo" | "acido" | "equilibrado",
  "effect": "fuerte" | "ligero" | "sin_alcohol" | "neutro",
  "difficulty": "facil" | "media" | "avanzada",
  "theme": "texto del tema/inspiración" o null
}`;

function isValid<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

/**
 * Análisis con LLM. Solo se usa para COMPLETAR matices que la heurística no
 * capta (p.ej. dulzor implícito, tema sin "inspirado en"). Los números
 * deterministas (raciones/litros) siempre mandan sobre los del LLM.
 */
export async function analyzeRequest(promptText: string): Promise<RequestIntent> {
  const heuristic = analyzeRequestHeuristic(promptText);

  // Si la heurística ya es muy informativa, evitamos la llamada extra.
  const strongSignal =
    heuristic.theme != null ||
    heuristic.effect !== "neutro" ||
    heuristic.sweetness !== "equilibrado" ||
    heuristic.kind === "batch";

  if (strongSignal || process.env.AI_MOCK === "true") {
    return heuristic;
  }

  try {
    const prompt = `Eres un analista de barra. Clasifica esta petición de cóctel en español sin inventar datos.\n\nPetición: """${promptText}"""\n\n${LLM_ANALYSIS_SCHEMA}`;
    const res = await ai.generateText(prompt, { maxTokens: 250 });
    const parsed = parseJsonObject(res.text);
    if (!parsed) return heuristic;

    const merged: Omit<RequestIntent, "tags" | "rationale"> = {
      // Los números deterministas mandan; si la heurística no detectó, usamos LLM.
      servings: heuristic.servings ?? toIntOrNull(parsed.servings),
      volumeLiters: heuristic.volumeLiters ?? toFloatOrNull(parsed.volumeLiters),
      kind:
        heuristic.kind === "batch"
          ? "batch"
          : isValid(parsed.kind, ["single", "batch"] as const)
            ? parsed.kind
            : "single",
      sweetness:
        heuristic.sweetness !== "equilibrado"
          ? heuristic.sweetness
          : isValid(parsed.sweetness, ["dulce", "seco", "amargo", "acido", "equilibrado"] as const)
            ? parsed.sweetness
            : "equilibrado",
      effect:
        heuristic.effect !== "neutro"
          ? heuristic.effect
          : isValid(parsed.effect, ["fuerte", "ligero", "sin_alcohol", "neutro"] as const)
            ? parsed.effect
            : "neutro",
      difficulty: isValid(parsed.difficulty, ["facil", "media", "avanzada"] as const)
        ? parsed.difficulty
        : heuristic.difficulty,
      theme:
        heuristic.theme ??
        (typeof parsed.theme === "string" && parsed.theme.trim().length >= 2
          ? parsed.theme.trim().slice(0, 80)
          : null),
      targetAbv: heuristic.targetAbv,
    };

    // Recalcular ABV/kind por si el LLM cambió el efecto o detectó batch.
    merged.targetAbv = abvForEffect(merged.effect) ?? heuristic.targetAbv;
    if (merged.kind === "batch" && merged.difficulty === "media" && (merged.servings ?? 0) >= 20) {
      merged.difficulty = "facil";
    }

    return {
      ...merged,
      tags: buildTags(merged),
      rationale: describeIntent(merged),
    };
  } catch {
    return heuristic;
  }
}

function toIntOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function toFloatOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}
