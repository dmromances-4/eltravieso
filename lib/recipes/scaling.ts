import type { IngredientItem } from "@/lib/recipes/parse";

/**
 * Escalado determinista de cantidades. La IA genera una receta para 1 copa
 * (o por una ración); aquí multiplicamos las cantidades de forma fiable para
 * servir a N personas o producir N litros, sin dejar la aritmética al LLM.
 */

export interface ScaleResult {
  ingredients: IngredientItem[];
  /** Raciones finales tras el escalado. */
  servings: number;
  /** Volumen total aproximado en litros (si es relevante). */
  totalLiters: number | null;
  /** Factor aplicado sobre la receta base (1 ración). */
  factor: number;
  /** Notas extra de preparación por lote (jarra/recipiente, hielo, etc.). */
  batchNotes: string[];
}

/** Volumen estándar de servicio por ración según el tipo de preparación (en ml). */
const SERVING_ML = {
  cocktail: 120, // copa de cóctel servida
  sangria: 200, // vaso de sangría/ponche
};

type Unit = "ml" | "cl" | "l" | "g" | "kg" | "dash" | "unit" | "unknown";

interface ParsedAmount {
  value: number;
  unit: Unit;
  /** Sufijo no numérico original (p.ej. "ml de zumo"), para reconstruir. */
  suffix: string;
}

const UNIT_PATTERNS: Array<{ re: RegExp; unit: Unit }> = [
  { re: /^ml\b|mililitros?/, unit: "ml" },
  { re: /^cl\b|centilitros?/, unit: "cl" },
  { re: /^l\b|litros?|lts?\b/, unit: "l" },
  { re: /^kg\b|kilos?|kilogramos?/, unit: "kg" },
  { re: /^g\b|gramos?/, unit: "g" },
  { re: /dash|golpes?|gotas?/, unit: "dash" },
  { re: /unidad|unidades|ud\b|rodajas?|hojas?|ramas?|cucharad/, unit: "unit" },
];

/** Convierte "60 ml", "2 cl", "1,5 l", "2 dashes" en {value, unit, suffix}. */
export function parseAmount(amount: string): ParsedAmount | null {
  if (!amount) return null;
  const cleaned = amount.trim().toLowerCase().replace(",", ".");
  const m = cleaned.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!m) return null;
  const value = parseFloat(m[1]);
  if (!Number.isFinite(value)) return null;
  const rest = m[2].trim();

  let unit: Unit = rest === "" ? "unit" : "unknown";
  for (const { re, unit: u } of UNIT_PATTERNS) {
    if (re.test(rest)) {
      unit = u;
      break;
    }
  }
  return { value, unit, suffix: rest };
}

/** Convierte un volumen a ml; null si la unidad no es de volumen. */
function toMl(p: ParsedAmount): number | null {
  switch (p.unit) {
    case "ml":
      return p.value;
    case "cl":
      return p.value * 10;
    case "l":
      return p.value * 1000;
    default:
      return null;
  }
}

/** Formatea un volumen en ml a la unidad más legible (ml < 1000, si no en L). */
function formatMl(ml: number): string {
  if (ml >= 1000) {
    const liters = ml / 1000;
    return `${trimNumber(liters)} l`;
  }
  return `${trimNumber(Math.round(ml))} ml`;
}

function trimNumber(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",");
}

/** Escala una sola cantidad por un factor, manteniendo unidades coherentes. */
export function scaleAmount(amount: string, factor: number): string {
  const parsed = parseAmount(amount);
  if (!parsed) return amount; // no numérico (ej. "al gusto") -> intacto

  const scaledValue = parsed.value * factor;

  const ml = toMl(parsed);
  if (ml != null) {
    return formatMl(ml * factor);
  }

  // Unidades no volumétricas (g, kg, unidades, dashes): multiplicar y reconstruir.
  const rounded = parsed.unit === "unit" ? Math.max(1, Math.round(scaledValue)) : roundSmart(scaledValue);
  const suffix = parsed.suffix ? ` ${parsed.suffix}` : "";
  return `${trimNumber(rounded)}${suffix}`.trim();
}

function roundSmart(n: number): number {
  if (n >= 100) return Math.round(n);
  if (n >= 10) return Math.round(n * 10) / 10;
  return Math.round(n * 100) / 100;
}

/**
 * Calcula el factor de escala a partir de la intención.
 * - Si hay volumen objetivo (litros), se escala para alcanzar ese volumen total.
 * - Si hay raciones, se multiplica por el nº de raciones.
 */
export function computeScaleFactor(opts: {
  servings: number | null;
  volumeLiters: number | null;
  baseVolumeMl: number;
  servingMl: number;
}): { factor: number; servings: number; totalLiters: number | null } {
  const { servings, volumeLiters, baseVolumeMl, servingMl } = opts;

  if (volumeLiters != null && volumeLiters > 0) {
    const targetMl = volumeLiters * 1000;
    const factor = baseVolumeMl > 0 ? targetMl / baseVolumeMl : 1;
    const derivedServings = Math.max(1, Math.round(targetMl / servingMl));
    return { factor, servings: derivedServings, totalLiters: volumeLiters };
  }

  if (servings != null && servings > 0) {
    const factor = servings;
    const totalMl = baseVolumeMl * factor;
    return { factor, servings, totalLiters: Math.round((totalMl / 1000) * 100) / 100 };
  }

  return { factor: 1, servings: 1, totalLiters: null };
}

/** Suma el volumen (ml) de los ingredientes volumétricos de una receta base. */
export function estimateBaseVolumeMl(ingredients: IngredientItem[]): number {
  let total = 0;
  for (const ing of ingredients) {
    const p = parseAmount(ing.amount);
    if (!p) continue;
    const ml = toMl(p);
    if (ml != null) total += ml;
  }
  // Si no hay volúmenes reconocibles, asumimos una copa estándar.
  return total > 0 ? total : SERVING_ML.cocktail;
}

/**
 * Escala una receta base (1 ración) a la intención dada.
 * `isSangria` ajusta el tamaño de ración de servicio.
 */
export function scaleRecipe(
  ingredients: IngredientItem[],
  opts: { servings: number | null; volumeLiters: number | null; isSangria?: boolean },
): ScaleResult {
  const baseVolumeMl = estimateBaseVolumeMl(ingredients);
  const servingMl = opts.isSangria ? SERVING_ML.sangria : SERVING_ML.cocktail;

  const { factor, servings, totalLiters } = computeScaleFactor({
    servings: opts.servings,
    volumeLiters: opts.volumeLiters,
    baseVolumeMl,
    servingMl,
  });

  if (factor === 1) {
    return {
      ingredients,
      servings: 1,
      totalLiters: null,
      factor: 1,
      batchNotes: [],
    };
  }

  const scaled = ingredients.map((ing) => ({
    name: ing.name,
    amount: scaleAmount(ing.amount, factor),
  }));

  return {
    ingredients: scaled,
    servings,
    totalLiters,
    factor: Math.round(factor * 100) / 100,
    batchNotes: buildBatchNotes(servings, totalLiters, Boolean(opts.isSangria)),
  };
}

function buildBatchNotes(servings: number, totalLiters: number | null, isSangria: boolean): string[] {
  const notes: string[] = [];
  const container =
    totalLiters != null && totalLiters >= 8
      ? "dispensador o cubo de ponche"
      : totalLiters != null && totalLiters >= 3
        ? "jarra grande o garrafa"
        : "jarra";
  notes.push(`Preparar en ${container}; remover bien para integrar antes de servir.`);
  if (isSangria) {
    notes.push("Macerar la fruta y el alcohol en frío al menos 4 h (idealmente toda la noche).");
    notes.push("Añadir el componente con gas justo antes de servir para no perder efervescencia.");
  }
  notes.push("Enfriar la base sin diluir; añadir hielo en el vaso, no en el recipiente común.");
  if (totalLiters != null) {
    notes.push(`Rinde ~${servings} raciones (${trimNumber(totalLiters)} L aprox.).`);
  } else {
    notes.push(`Rinde ~${servings} raciones.`);
  }
  return notes;
}
