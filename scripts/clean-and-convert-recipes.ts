#!/usr/bin/env tsx
/**
 * clean-and-convert-recipes.ts
 *
 * Limpieza masiva de data/cocktails.json:
 *  1. Backup automático.
 *  2. Eliminación de recetas basura (títulos vacíos/inválidos).
 *  3. Deduplicación por slug.
 *  4. Normalización de vasos (GLASS_REPLACEMENTS ampliado).
 *  5. Normalización de ingredientes (INGREDIENT_CLEANUP + PRODUCT_REPLACEMENTS).
 *  6. Conversión de unidades: oz → ml, ml grande → cl si tiene sentido.
 *  7. Limpieza de métodos: traducción de guarniciones en inglés,
 *     expansión de métodos legacy con expandMethodToSpanish.
 *  8. Escritura del JSON limpio.
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";

// ----- Reimplementaciones ligeras de la lógica de polish-recipe.ts -----
// (sin importar el módulo Next.js completo que requiere alias @/)

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");
const COCKTAILS_PATH = resolve(ROOT, "data/cocktails.json");

// ======================== STYLE GUIDE (inline para ejecución CLI) ========================

const PRODUCT_REPLACEMENTS: [RegExp, string][] = [
  [/Strucchi\s+Rosso\s+Vermouth/gi, "Vermut rojo El Travieso"],
  [/Strucchi\s+Red\s+Bitter\s*\([^)]*\)/gi, "Bitter rojo El Travieso"],
  [/Strucchi\s+Red\s+Bitter/gi, "Bitter rojo El Travieso"],
  [/Strucchi\s+Rosso/gi, "Vermut rojo El Travieso"],
  [/Strucchi/gi, "El Travieso"],
];

const GLASS_REPLACEMENTS: [RegExp, string][] = [
  // Fase 1: Prefijos descriptivos
  [/^Photographed in (?:a|an)\s+/i, ""],
  [/^Serve in (?:a|an)\s+/i, ""],
  [/^(?:an|a)\s+/i, ""],

  // Fase 2: Marcas comerciales
  [/Libbey\s+DOF[^,]*/gi, "Vaso old fashioned"],
  [/Libbey[^,]*/gi, "Copa de autor"],
  [/Michelangelo\s+Coppa[^,]*/gi, "Copa coupe"],
  [/Michelangelo[^,]*/gi, "Copa de autor"],
  [/Nude\s+Bar[^,]*Martini[^,]*/gi, "Copa de martini"],
  [/Nude\s+Bar[^,]*/gi, "Copa de autor"],
  [/LSA\s+Olivia[^,]*Champagne[^,]*/gi, "Copa coupe"],
  [/LSA[^,]*/gi, "Copa de autor"],
  [/New\s+Era\s+Double[^,]*old\s*fashioned[^,]*/gi, "Vaso old fashioned"],
  [/New\s+Era[^,]*/gi, "Copa de autor"],

  // Fase 3: UB
  [/UB\s+1910[^,]*old\s*fashioned[^,]*/gi, "Vaso old fashioned"],
  [/UB\s+1910[^,]*/gi, "Copa de autor"],
  [/UB\s+Koto[^,]*old\s*fashioned[^,]*/gi, "Vaso old fashioned"],
  [/UB\s+Koto[^,]*/gi, "Copa de autor"],
  [/UB\s+Nick\s+And\s+Nora[^,]*/gi, "Copa Nick & Nora"],
  [/UB\s+Retro\s+Coupe[^,]*/gi, "Copa coupe"],
  [/UB\s+Retro[^,]*/gi, "Copa coupe"],
  [/UB\s+[A-Z][^,]*/g, "Copa de autor"],

  // Fase 4: Urban Bar
  [/Urban\s+Bar[^,]*Old\s+Fashioned[^,]*/gi, "Vaso old fashioned"],
  [/Urban\s+Bar[^,]*Alto\s+Coupe[^,]*/gi, "Copa coupe"],
  [/Urban\s+Bar[^,]*Coupe[^,]*/gi, "Copa coupe"],
  [/Urban\s+Bar[^,]*Fluet[^,]*/gi, "Vaso old fashioned"],
  [/Urban\s+Bar[^,]*Flute[^,]*/gi, "Copa flute"],
  [/Urban\s+Bar[^,]*Highball[^,]*/gi, "Vaso highball"],
  [/Urban\s+Bar[^,]*Collins[^,]*/gi, "Vaso collins"],
  [/Urban\s+Bar[^,]*Nick[^,]*Nora[^,]*/gi, "Copa Nick & Nora"],
  [/Urban\s+Bar[^,]*/gi, "Copa de autor"],

  // Fase 5: Repeticiones
  [/(?:Vaso\s+){2,}old\s+fashioned/gi, "Vaso old fashioned"],
  [/(?:Copa\s+){2,}Nick\s*&?\s*Nora(?:\s+glass)?/gi, "Copa Nick & Nora"],
  [/(?:Copa\s+){2,}(coupe|flute|martini)/gi, "Copa $1"],

  // Fase 6: Inglés → español
  [/Martini\s+glass/i, "Copa de martini"],
  [/Coupe\s+glass/i, "Copa coupe"],
  [/Old[- ]Fashioned\s+glass/i, "Vaso old fashioned"],
  [/Old[- ]Fashioned[^,]*/i, "Vaso old fashioned"],
  [/Highball\s+glass/i, "Vaso highball"],
  [/Collins\s+glass/i, "Vaso collins"],
  [/Rocks\s+glass/i, "Vaso rocks"],
  [/Nick\s*&?\s*Nora(?:\s+glass)?/i, "Copa Nick & Nora"],
  [/Poco\s+grande/i, "Copa poco grande"],
  [/Toddy\s+glass/i, "Vaso toddy"],
  [/Tiki\s+mug/i, "Tiki mug"],
  [/Flute\s+glass/i, "Copa flute"],
  [/Wine\s+glass/i, "Copa de vino"],
  [/Hurricane\s+glass/i, "Copa hurricane"],
  [/Snifter/i, "Copa balón"],
  [/Champagne\s+(?:saucer|flute)/i, "Copa coupe"],
  [/Cocktail\s+glass/i, "Copa de cóctel"],
  [/Julep\s+cup/i, "Vaso julep"],
  [/Copper\s+mug/i, "Moscow mule mug"],
  [/Irish\s+coffee\s+glass/i, "Vaso Irish coffee"],
  [/Shot\s+glass/i, "Vaso de chupito"],
];

const INGREDIENT_CLEANUP: [RegExp, string][] = [
  [/\s+chilled\b/gi, ""],
  [/\s+from freezer\b/gi, ""],
  [/\s*\(freshly squeezed\)/gi, " recién exprimido"],
  [/\s*\(freshly-squeezed\)/gi, " recién exprimido"],
  [/\s*\(chilled\)/gi, ""],

  // Vermouths
  [/\bRosso\/sweet vermouth\b/gi, "Vermut rojo El Travieso"],
  [/\bSweet vermouth\b/gi, "Vermut rojo El Travieso"],
  [/\bDry vermouth\b/gi, "Vermut seco"],
  [/\bBianco vermouth\b/gi, "Vermut bianco"],

  // Zumos
  [/\bPineapple juice\b/gi, "Zumo de piña"],
  [/\bLemon juice\b/gi, "Zumo de limón"],
  [/\bLime juice\b/gi, "Zumo de lima"],
  [/\bOrange juice\b/gi, "Zumo de naranja"],
  [/\bGrapefruit juice\b/gi, "Zumo de pomelo"],
  [/\bCranberry juice\b/gi, "Zumo de arándanos"],
  [/\bTomato juice\b/gi, "Zumo de tomate"],
  [/\bApple juice\b/gi, "Zumo de manzana"],
  [/\bPassion fruit (?:juice|purée|puree)\b/gi, "Zumo de maracuyá"],
  [/\bPassion fruit\b/gi, "Maracuyá"],

  // Siropes
  [/\bSugar syrup 'rich'[^)]*\)/gi, "Sirope de azúcar rico (2:1)"],
  [/\bSugar syrup\b/gi, "Sirope de azúcar"],
  [/\bSimple syrup\b/gi, "Sirope de azúcar"],
  [/\bHoney syrup\b/gi, "Sirope de miel"],
  [/\bAgave syrup\b/gi, "Sirope de agave"],
  [/\bOrgeat\b/gi, "Orgeat (sirope de almendra)"],
  [/\bGrenadine\b/gi, "Granadina"],

  // Café
  [/\bExprè Caffè Italiano[^)]*\)/gi, "Café espresso italiano recién hecho"],
  [/\bExprè Caffè Italiano\b/gi, "Café espresso italiano"],
  [/\bfreshly made hot Espresso Coffee\b/gi, "café espresso caliente recién hecho"],

  // Refrescos
  [/\bThomas Henry Soda Water\b/gi, "Agua con gas"],
  [/\bSoda Water\b/gi, "Agua con gas"],
  [/\bClub soda\b/gi, "Agua con gas"],
  [/\bTonic Water\b/gi, "Tónica"],
  [/\bTonic water\b/gi, "Tónica"],

  // Espirituosos
  [/\bBourbon whiskey\b/gi, "Bourbon"],
  [/\bStraight rye whiskey[^)]*\)/gi, "Rye whiskey 50 % vol."],
  [/\bBlended Scotch whisky\b/gi, "Whisky escocés blended"],
  [/\bIrish whiskey\b/gi, "Irish whiskey"],
  [/\bLight white rum[^)]*\)/gi, "Ron blanco"],
  [/\bWhite rum\b/gi, "Ron blanco"],
  [/\bDark rum\b/gi, "Ron oscuro"],
  [/\bAged rum\b/gi, "Ron añejo"],
  [/\bAbsinthe\b/gi, "Absenta"],
  [/\bElderflower\s+liqueur\b/gi, "Licor de flor de saúco"],
  [/\bElderflower\b/gi, "Flor de saúco"],

  // Otros
  [/\bEgg white\b/gi, "Clara de huevo"],
  [/\bDouble cream\b/gi, "Nata para montar"],
  [/\bHeavy cream\b/gi, "Nata para montar"],
  [/\bCoconut cream\b/gi, "Crema de coco"],

  // Ginebras
  [/\bHayman's London Dry Gin\b/gi, "Ginebra Hayman's London Dry"],
  [/\bLondon Dry Gin\b/gi, "Ginebra London Dry"],

  // Bitters
  [/\bOrange Bitters by Angostura\b/gi, "Angostura Orange Bitters"],
  [/\bAngostura Aromatic Bitters\b/gi, "Angostura Bitters"],
  [/\bPeychaud's or other Creole-style bitters\b/gi, "Peychaud's Bitters"],
  [/\bBoker's style bitters\b/gi, "Bitters estilo Boker's"],
  [/\bBob's Chocolate bitters\b/gi, "Bitters de chocolate"],
  [/\bCreole bitters\b/gi, "Peychaud's Bitters"],

  // Formato
  [/\b(\d+)\s+drop\b/gi, "$1 gotas de"],
  [/\b(\d+)\s+dash(?:es)?\b/gi, "$1 gotas de"],
  [/\s{2,}/g, " "],
];

const ENCODING_FIXES: [RegExp, string][] = [
  [/CaffÃ¨/g, "Caffè"],
  [/ExprÃ¨/g, "Exprè"],
  [/Ã©/g, "é"],
  [/Ã¨/g, "è"],
  [/Ã¡/g, "á"],
  [/Ã³/g, "ó"],
  [/Ã­/g, "í"],
  [/Ãº/g, "ú"],
  [/Ã±/g, "ñ"],
  [/â€™/g, "'"],
  [/â€œ/g, '"'],
  [/â€\u009d/g, '"'],
  [/â€"/g, "—"],
  [/â€"/g, "–"],
  [/\u2044/g, "/"],
  [/[\u00a0\u2009]/g, " "],
];

const JUNK_TITLE_PATTERNS = [
  /^c[óo]ctel\s+quiero/i,
  /^c[óo]ctel\s+spritz/i,
  /^c[óo]ctel\s+vermut\s+rojo\s+con\s*$/i,
  /^receta\s+\d*$/i,
  /^sin\s+t[ií]tulo/i,
  /^cóctel sin título$/i,
];

// ======================== HELPERS ========================

function applyReplacements(text: string, rules: [RegExp, string][]): string {
  let out = text;
  for (const [p, r] of rules) {
    out = out.replace(p, r);
  }
  return out;
}

function fixEncoding(text: string): string {
  return applyReplacements(text, ENCODING_FIXES);
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// ======================== GLASS ========================

function normalizeGlass(glass: string): string {
  let value = fixEncoding(glass).trim();
  if (!value) return "Copa de autor";

  // Apply replacements in a loop until stable (handles cascading patterns)
  let prev = "";
  let iterations = 0;
  while (prev !== value && iterations < 5) {
    prev = value;
    for (const [p, r] of GLASS_REPLACEMENTS) {
      value = value.replace(p, r);
    }
    value = normalizeWhitespace(value);
    iterations++;
  }

  // Extra cleanup: strip brand prefixes that survived
  value = value.replace(/^(?:Double|Classico\s+Margot|Margot)\s+/i, "");

  // Aggressive dedup: collapse any "Vaso Vaso ... old fashioned" or "Copa Copa ... Nick"
  value = value.replace(/^(?:Vaso\s+)+(?=Vaso\s+old)/i, "");
  value = value.replace(/^(?:Copa\s+)+(?=Copa\s+Nick)/i, "");
  value = value.replace(/^(?:Copa\s+)+(?=Copa\s+poco)/i, "");

  // Strip volume specs like "(14.25oz)" or "225ml"
  value = normalizeWhitespace(
    value.replace(/\(\d+[^)]*\)/g, "").replace(/\d+\s*cl\b/gi, "").replace(/\d+\s*ml\b/gi, "").replace(/\d+(\.\d+)?\s*oz\b/gi, "")
  );

  const lower = value.toLowerCase();
  if (/martini/.test(lower) && !/copa/.test(lower)) return "Copa de martini";
  if (/coupe/.test(lower) && !/copa/.test(lower)) return "Copa coupe";
  if (/old fashioned/.test(lower) && !/vaso/.test(lower)) return "Vaso old fashioned";
  if (/highball/.test(lower) && !/vaso/.test(lower)) return "Vaso highball";
  if (/collins/.test(lower) && !/vaso/.test(lower)) return "Vaso collins";
  if (/rocks/.test(lower) && !/vaso/.test(lower)) return "Vaso rocks";
  if (/flute|fluet/.test(lower) && !/copa/.test(lower)) return "Copa flute";
  if (/poco grande/.test(lower) && !/copa/.test(lower)) return "Copa poco grande";

  // Final catch: still has repeated "Vaso" or "Copa"
  if (/Vaso\s+Vaso/i.test(value)) return "Vaso old fashioned";
  if (/Copa\s+Copa/i.test(value)) return "Copa Nick & Nora";

  if (value.length < 3 || /^urban bar/i.test(value)) return "Copa de autor";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

// ======================== INGREDIENTS ========================

function normalizeIngredient(line: string): string {
  let value = fixEncoding(line).trim();
  value = applyReplacements(value, PRODUCT_REPLACEMENTS);
  value = applyReplacements(value, INGREDIENT_CLEANUP);
  value = value.replace(/^[-\u2022*]+\s*/, "");
  return normalizeWhitespace(value);
}

function dedupeIngredients(ingredients: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of ingredients) {
    const line = normalizeWhitespace(raw);
    if (!line) continue;
    const key = line.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(line);
  }
  return result;
}

function splitIngredientLines(ingredients: string[]): string[] {
  return ingredients.flatMap((item) =>
    item
      .split(/\r?\n|\|\|/)
      .map((part) => part.trim())
      .filter(Boolean)
  );
}

// ======================== UNIT CONVERSION ========================

/**
 * Convierte las cantidades de oz a ml y normaliza a cl donde tiene sentido.
 *
 * Reglas:
 *  - "X oz Producto"  → X * 29.5735 → redondeado a ml → "Y ml Producto"
 *  - Cantidades >= 10 ml se convierten a cl: "Y ml" → "Z cl"
 *  - Cantidades < 10 ml se mantienen en ml (ej: "5 ml sirope")
 *  - "gotas", "pizcas", "rodajas", "hojas", "piezas" NO se tocan
 *  - Fracciones: "½" → 0.5, "¼" → 0.25, "¾" → 0.75, "⅓" → 0.333
 */
function convertUnits(ingredient: string): string {
  // No tocar unidades no volumétricas
  if (/\b(gotas?|golpes?|pizcas?|rodajas?|hojas?|piezas?|trozos?|ramitas?|cucharadas?|cucharaditas?|barspoons?)\b/i.test(ingredient)) {
    return ingredient;
  }

  // Fracciones unicode
  const fractionMap: Record<string, number> = {
    "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 0.333, "⅔": 0.667,
    "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
  };

  // Convert oz → ml
  let result = ingredient.replace(
    /^(\d+(?:\.\d+)?)\s*oz\b/i,
    (_match, num) => {
      const ml = Math.round(parseFloat(num) * 29.5735);
      return `${ml} ml`;
    }
  );

  // Fracciones: "½ oz" → ml
  for (const [frac, val] of Object.entries(fractionMap)) {
    const re = new RegExp(`^(\\d+)?\\s*${frac}\\s*oz\\b`, "i");
    result = result.replace(re, (_match, whole) => {
      const total = (whole ? parseFloat(whole) : 0) + val;
      const ml = Math.round(total * 29.5735);
      return `${ml} ml`;
    });
  }

  // ml → cl para cantidades >= 10 ml
  result = result.replace(
    /^(\d+(?:\.\d+)?)\s*ml\b/i,
    (_match, num) => {
      const ml = parseFloat(num);
      if (ml >= 10) {
        const cl = ml / 10;
        // Redondear a 1 decimal max, quitar .0
        const formatted = cl % 1 === 0 ? String(cl) : cl.toFixed(1);
        return `${formatted} cl`;
      }
      return `${ml} ml`;
    }
  );

  return result;
}

// ======================== METHOD CLEANUP ========================

/**
 * Traduce guarniciones que quedaron en inglés dentro de métodos ya "semi-traducidos".
 * Ej: "Prepara la guarnición: half orange slice wheel skewered with green olive."
 *   → "Prepara la guarnición: media rodaja de naranja con una aceituna verde."
 */
const GARNISH_TRANSLATIONS: [RegExp, string][] = [
  [/half orange slice wheel skewered with green olive/gi, "media rodaja de naranja con una aceituna verde"],
  [/each cocktail with a skewered maraschino cherry/gi, "cereza marrasquino en un pincho"],
  [/(?:a\s+)?skewered maraschino cherr(?:y|ies)/gi, "cereza marrasquino en un pincho"],
  [/(?:a\s+)?maraschino cherry/gi, "una cereza marrasquino"],
  [/(?:a\s+)?lemon (?:zest )?twist/gi, "twist de limón"],
  [/(?:an?\s+)?orange (?:zest )?twist(?:\s+over cocktail(?:\s+and discard)?)?/gi, "twist de naranja"],
  [/(?:a\s+)?lime (?:zest )?twist/gi, "twist de lima"],
  [/(?:a\s+)?grapefruit (?:zest )?twist/gi, "twist de pomelo"],
  [/(?:a\s+)?lemon wheel/gi, "rodaja de limón"],
  [/(?:an?\s+)?orange wheel/gi, "rodaja de naranja"],
  [/(?:a\s+)?lime wheel/gi, "rodaja de lima"],
  [/(?:a\s+)?cucumber slice/gi, "rodaja de pepino"],
  [/(?:a\s+)?sprig of (?:fresh )?mint/gi, "ramita de menta fresca"],
  [/(?:a\s+)?mint sprig/gi, "ramita de menta"],
  [/(?:a\s+)?rosemary sprig/gi, "ramita de romero"],
  [/(?:a\s+)?star anise/gi, "anís estrellado"],
  [/(?:a\s+)?cinnamon stick/gi, "rama de canela"],
  [/(?:a\s+)?dehydrated (?:orange|lemon|lime) wheel/gi, "rodaja deshidratada de cítrico"],
  [/(?:a\s+)?cocktail cherry/gi, "cereza de cóctel"],
  [/(?:a\s+)?cocktail onion/gi, "cebollita de cóctel"],
  [/(?:a\s+)?green olive/gi, "aceituna verde"],
  [/dusted with (?:freshly )?grated nutmeg/gi, "espolvoreado con nuez moscada rallada"],
  [/(?:fresh )?nutmeg/gi, "nuez moscada"],
];

function cleanMethod(method: string): string {
  let cleaned = fixEncoding(method);

  // Traduce guarniciones en inglés embebidas en pasos en español
  for (const [p, r] of GARNISH_TRANSLATIONS) {
    cleaned = cleaned.replace(p, r);
  }

  // Limpia residuos como "Garnish with" o "Express oils of" que quedaron en inglés
  cleaned = cleaned.replace(/\bGarnish with\b/gi, "Guarnición:");
  cleaned = cleaned.replace(/\bExpress (?:the )?oils of\b/gi, "Exprime los aceites de");

  // Limpia mayúsculas tipo STIR/SHAKE/BUILD en pasos que se hayan dejado
  cleaned = cleaned.replace(/\bSTIR\b/g, "remueve");
  cleaned = cleaned.replace(/\bSHAKE\b/g, "agita");
  cleaned = cleaned.replace(/\bBUILD\b/g, "construye");
  cleaned = cleaned.replace(/\bFINE STRAIN\b/gi, "cuela con colador fino");

  return cleaned;
}

function looksEnglishMethod(method: string): boolean {
  return (
    /^(STIR|SHAKE|POUR|BUILD|DRY BLEND|COMBINE|SELECT)/i.test(method) ||
    (method.includes("\n") && method.split("\n").filter(Boolean).every((l) => l === l.toUpperCase()))
  );
}

// ======================== expandMethodToSpanish (simplified from polish-recipe.ts) ========================

function inferTechnique(method: string): "stir" | "shake" | "build" | "blend" | "throw" {
  const m = method.toUpperCase();
  if (m.includes("SHAKE")) return "shake";
  if (m.includes("BLEND")) return "blend";
  if (m.includes("THROW")) return "throw";
  if (m.includes("STIR")) return "stir";
  return "build";
}

function articleForGlass(glass: string): "el" | "la" {
  const lower = glass.toLowerCase();
  if (/^vaso|^tiki|^copa balón/.test(lower)) return "el";
  return "la";
}

function expandMethodToSpanish(glass: string, method: string): string {
  const technique = inferTechnique(method);
  const normalizedGlass = normalizeGlass(glass);
  const art = articleForGlass(normalizedGlass);
  const needsChilledGlass = /chilled glass|pre-chill|FINE STRAIN into chilled/i.test(method);
  const onTheRocks = /ice-filled|on-the-rocks|over a large cube/i.test(method);
  const fineStrain = /FINE STRAIN|fine strain/i.test(method);

  const lines: string[] = [];
  let step = 1;

  if (needsChilledGlass && !onTheRocks) {
    lines.push(`${step}. Enfría ${art} ${normalizedGlass.toLowerCase()} con hielo y agua; descarta el hielo antes de servir.`);
  } else if (onTheRocks) {
    lines.push(`${step}. Llena ${art} ${normalizedGlass.toLowerCase()} con hielo cubito fresco.`);
  } else {
    lines.push(`${step}. Prepara ${art} ${normalizedGlass.toLowerCase()} limpio y frío para servir.`);
  }
  step++;

  if (technique === "stir") {
    lines.push(`${step}. Vierte todos los ingredientes en un vaso mezclador con hielo cubito.`);
    step++;
    lines.push(`${step}. Remueve con cuchara de bar unos 25-35 segundos hasta que la mezcla quede bien fría y diluida.`);
    step++;
    if (fineStrain) {
      lines.push(`${step}. Cuela con colador fino en el vaso de servicio.`);
    } else {
      lines.push(`${step}. Cuela en el vaso preparado.`);
    }
    step++;
  } else if (technique === "shake") {
    lines.push(`${step}. Vierte los ingredientes en una coctelera con hielo cubito.`);
    step++;
    lines.push(`${step}. Agita enérgicamente unos 12-15 segundos hasta que la coctelera esté muy fría al tacto.`);
    step++;
    lines.push(`${step}. Cuela con colador fino en el vaso preparado.`);
    step++;
  } else if (technique === "build") {
    lines.push(`${step}. Vierte los ingredientes en el vaso en el orden indicado.`);
    step++;
    lines.push(`${step}. Remueve suavemente con cuchara de bar para integrar.`);
    step++;
  } else if (technique === "blend") {
    lines.push(`${step}. Añade los ingredientes a la batidora.`);
    step++;
    lines.push(`${step}. Incorpora hielo picado y tritura hasta textura homogénea.`);
    step++;
    lines.push(`${step}. Vierte en el vaso de servicio.`);
    step++;
  } else {
    lines.push(`${step}. Vierte los ingredientes en un vaso mezclador con hielo.`);
    step++;
    lines.push(`${step}. Mezcla con técnica throw o remueve suavemente.`);
    step++;
    lines.push(`${step}. Cuela en el vaso de servicio.`);
    step++;
  }

  lines.push(`${step}. Sirve de inmediato, bien frío.`);
  return lines.join("\n");
}

// ======================== MAIN ========================

interface CocktailRecipe {
  title: string;
  slug: string;
  rating: number;
  glass: string;
  ingredients: string[];
  method: string;
  abv?: string;
  kcal?: number;
  cover?: string;
  id?: string;
  reviewStatus?: string;
  diffordsId?: number;
  sourceUrl?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  summary?: string;
  [key: string]: unknown;
}

function main() {
  console.log("🧹 Limpieza de recetas — clean-and-convert-recipes.ts");
  console.log("=".repeat(60));

  // 1. Backup
  const backupPath = COCKTAILS_PATH.replace(".json", `.backup-${Date.now()}.json`);
  copyFileSync(COCKTAILS_PATH, backupPath);
  console.log(`📦 Backup: ${backupPath}`);

  // 2. Cargar
  const raw: CocktailRecipe[] = JSON.parse(readFileSync(COCKTAILS_PATH, "utf-8"));
  console.log(`📖 Recetas cargadas: ${raw.length}`);

  // 3. Eliminar basura
  const filtered = raw.filter((r) => {
    if (!r.title?.trim()) return false;
    if (JUNK_TITLE_PATTERNS.some((p) => p.test(r.title.trim()))) {
      console.log(`  🗑️  Eliminada (basura): "${r.title}"`);
      return false;
    }
    return true;
  });
  console.log(`🔍 Tras filtrar basura: ${filtered.length} (eliminadas: ${raw.length - filtered.length})`);

  // 4. Deduplicar por slug
  const slugMap = new Map<string, CocktailRecipe>();
  let dupeCount = 0;
  for (const r of filtered) {
    if (slugMap.has(r.slug)) {
      const existing = slugMap.get(r.slug)!;
      // Keep the one with higher rating or more data
      if ((r.rating || 0) > (existing.rating || 0) || r.ingredients.length > existing.ingredients.length) {
        console.log(`  🔄 Duplicado reemplazado: "${r.slug}" (mejor rating/datos)`);
        slugMap.set(r.slug, r);
      } else {
        console.log(`  🔄 Duplicado descartado: "${r.slug}"`);
      }
      dupeCount++;
    } else {
      slugMap.set(r.slug, r);
    }
  }
  const deduped = Array.from(slugMap.values());
  console.log(`🔍 Tras deduplicar: ${deduped.length} (duplicados: ${dupeCount})`);

  // 5. Normalizar cada receta
  let glassFixed = 0;
  let ingredientFixed = 0;
  let methodFixed = 0;
  let unitsConverted = 0;

  const cleaned = deduped.map((r) => {
    // Glass
    const oldGlass = r.glass;
    const newGlass = normalizeGlass(r.glass);
    if (oldGlass !== newGlass) glassFixed++;

    // Ingredients
    const rawIngs = splitIngredientLines(r.ingredients).map(normalizeIngredient).filter(Boolean);
    const dedupedIngs = dedupeIngredients(rawIngs);

    // Convert units
    const convertedIngs = dedupedIngs.map((ing) => {
      const converted = convertUnits(ing);
      if (converted !== ing) unitsConverted++;
      return converted;
    });

    // Track ingredient changes
    const ingsChanged = JSON.stringify(r.ingredients) !== JSON.stringify(convertedIngs);
    if (ingsChanged) ingredientFixed++;

    // Method
    let method = r.method;
    if (looksEnglishMethod(method)) {
      method = expandMethodToSpanish(newGlass, method);
      methodFixed++;
    } else {
      const cleanedMethod = cleanMethod(method);
      if (cleanedMethod !== method) {
        method = cleanedMethod;
        methodFixed++;
      }
    }

    // Fix encoding on title
    const title = fixEncoding(r.title).trim();

    return {
      ...r,
      title,
      glass: newGlass,
      ingredients: convertedIngs,
      method,
    };
  });

  console.log("\n📊 Resumen de cambios:");
  console.log(`  🍸 Vasos normalizados: ${glassFixed}`);
  console.log(`  🧪 Ingredientes corregidos: ${ingredientFixed}`);
  console.log(`  📐 Unidades convertidas: ${unitsConverted}`);
  console.log(`  📝 Métodos limpiados/traducidos: ${methodFixed}`);

  // 6. Escribir
  writeFileSync(COCKTAILS_PATH, JSON.stringify(cleaned, null, 2) + "\n", "utf-8");
  console.log(`\n✅ Escrito: ${COCKTAILS_PATH} (${cleaned.length} recetas)`);

  // 7. Sanity check
  const remaining = JSON.parse(readFileSync(COCKTAILS_PATH, "utf-8"));
  console.log(`🔎 Verificación: ${remaining.length} recetas en disco`);

  // Check for remaining problems
  let remainingProblems = 0;
  for (const r of remaining) {
    if (/Photographed|Vaso Vaso|Copa Copa|UB |Libbey|Michelangelo/i.test(r.glass)) {
      console.log(`  ⚠️  Vaso aún problemático: "${r.slug}" → "${r.glass}"`);
      remainingProblems++;
    }
    if (/Rosso\/sweet/i.test(JSON.stringify(r.ingredients))) {
      console.log(`  ⚠️  Ingrediente Rosso/sweet aún presente: "${r.slug}"`);
      remainingProblems++;
    }
  }

  if (remainingProblems === 0) {
    console.log("  ✅ No quedan problemas conocidos.");
  } else {
    console.log(`  ⚠️  ${remainingProblems} problemas residuales detectados.`);
  }
}

main();
