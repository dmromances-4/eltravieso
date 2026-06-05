/** Reglas editoriales del recetario El Travieso — ver docs/RECETAS-LIBRO-ESTILO.md */

export const RECIPE_STYLE_SUMMARY = `
Libro de estilo El Travieso:
- Español (España), tono de barra profesional y cercano.
- Vermut rojo de casa: "Vermut rojo El Travieso". Bitter tipo Campari: "Bitter rojo El Travieso".
- Vaso: nombre genérico en castellano (copa de martini, vaso old fashioned, copa coupe…), nunca marcas comerciales de cristalería.
- Ingredientes: "XX ml Nombre" (medida + unidad + producto). Sin duplicados. Sin "chilled"/"from freezer" en la lista.
- Método: 4-8 pasos numerados, imperativo, descriptivos (hielo, técnica, colado, guarnición, temperatura). No MAYÚSCULAS tipo STIR/SHAKE.
- Corregir erratas, nombres de productos y símbolos corruptos.
- Título: nombre limpio del cóctel, sin prefijos "Cóctel" ni texto truncado.
`.trim();

export const PRODUCT_REPLACEMENTS: [RegExp, string][] = [
  [/Strucchi\s+Rosso\s+Vermouth/gi, "Vermut rojo El Travieso"],
  [/Strucchi\s+Red\s+Bitter\s*\([^)]*\)/gi, "Bitter rojo El Travieso"],
  [/Strucchi\s+Red\s+Bitter/gi, "Bitter rojo El Travieso"],
  [/Strucchi\s+Rosso/gi, "Vermut rojo El Travieso"],
  [/Strucchi/gi, "El Travieso"],
];

export const GLASS_REPLACEMENTS: [RegExp, string][] = [
  [/^Serve in (?:a|an)\s+/i, ""],
  [/^a\s+/i, ""],
  [/Urban Bar[^,]*Old Fashioned[^,]*/gi, "Vaso old fashioned"],
  [/Urban Bar[^,]*Alto Coupe[^,]*/gi, "Copa coupe"],
  [/Urban Bar[^,]*Coupe[^,]*/gi, "Copa coupe"],
  [/Urban Bar[^,]*Fluet[^,]*/gi, "Vaso old fashioned"],
  [/Urban Bar[^,]*Flute[^,]*/gi, "Copa flute"],
  [/Urban Bar[^,]*Highball[^,]*/gi, "Vaso highball"],
  [/Urban Bar[^,]*Collins[^,]*/gi, "Vaso collins"],
  [/Urban Bar[^,]*Nick[^,]*Nora[^,]*/gi, "Copa Nick & Nora"],
  [/Urban Bar[^,]*/gi, "Copa de autor"],
  [/UB Retro Coupe[^,]*/gi, "Copa coupe"],
  [/UB Retro[^,]*/gi, "Copa coupe"],
  [/Martini glass/i, "Copa de martini"],
  [/Coupe glass/i, "Copa coupe"],
  [/Old[- ]Fashioned glass/i, "Vaso old fashioned"],
  [/Old[- ]Fashioned[^,]*/i, "Vaso old fashioned"],
  [/Highball glass/i, "Vaso highball"],
  [/Collins glass/i, "Vaso collins"],
  [/Rocks glass/i, "Vaso rocks"],
  [/Nick\s*&?\s*Nora/i, "Copa Nick & Nora"],
  [/Poco grande/i, "Copa poco grande"],
  [/Toddy glass/i, "Vaso toddy"],
  [/Tiki mug/i, "Tiki mug"],
  [/Flute glass/i, "Copa flute"],
  [/Wine glass/i, "Copa de vino"],
  [/Hurricane glass/i, "Copa hurricane"],
  [/Snifter/i, "Copa balón"],
];

export const INGREDIENT_CLEANUP: [RegExp, string][] = [
  [/\s+chilled\b/gi, ""],
  [/\s+from freezer\b/gi, ""],
  [/\s*\(freshly squeezed\)/gi, " recién exprimido"],
  [/\s*\(freshly-squeezed\)/gi, " recién exprimido"],
  [/\bPineapple juice\b/gi, "Zumo de piña"],
  [/\bLemon juice\b/gi, "Zumo de limón"],
  [/\bLime juice\b/gi, "Zumo de lima"],
  [/\bOrange juice\b/gi, "Zumo de naranja"],
  [/\bGrapefruit juice\b/gi, "Zumo de pomelo"],
  [/\bSugar syrup 'rich'[^)]*\)/gi, "Sirope de azúcar rico (2:1)"],
  [/\bSugar syrup\b/gi, "Sirope de azúcar"],
  [/\bExprè Caffè Italiano[^)]*\)/gi, "Café espresso italiano recién hecho"],
  [/\bExprè Caffè Italiano\b/gi, "Café espresso italiano"],
  [/\bfreshly made hot Espresso Coffee\b/gi, "café espresso caliente recién hecho"],
  [/\bSoda Water\b/gi, "Agua con gas"],
  [/\bThomas Henry Soda Water\b/gi, "Agua con gas"],
  [/\bBourbon whiskey\b/gi, "Bourbon"],
  [/\bStraight rye whiskey[^)]*\)/gi, "Rye whiskey 50 % vol."],
  [/\bBlended Scotch whisky\b/gi, "Whisky escocés blended"],
  [/\bLight white rum[^)]*\)/gi, "Ron blanco"],
  [/\bHayman's London Dry Gin\b/gi, "Ginebra Hayman's London Dry"],
  [/\bLondon Dry Gin\b/gi, "Ginebra London Dry"],
  [/\bOrange Bitters by Angostura\b/gi, "Angostura Orange Bitters"],
  [/\bAngostura Aromatic Bitters\b/gi, "Angostura Bitters"],
  [/\bPeychaud's or other Creole-style bitters\b/gi, "Peychaud's Bitters"],
  [/\bBoker's style bitters\b/gi, "Bitters estilo Boker's"],
  [/\bBob's Chocolate bitters\b/gi, "Bitters de chocolate"],
  [/\b(\d+)\s+drop\b/gi, "$1 gotas de"],
  [/\b(\d+)\s+dash\b/gi, "$1 gotas de"],
  [/\s{2,}/g, " "],
];

export const ENCODING_FIXES: [RegExp, string][] = [
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
  [/â€“/g, "–"],
  [/\u2044/g, "/"],
  [/[\u00a0\u2009]/g, " "],
];

export const JUNK_TITLE_PATTERNS = [
  /^c[óo]ctel\s+quiero/i,
  /^c[óo]ctel\s+spritz/i,
  /^c[óo]ctel\s+vermut\s+rojo\s+con\s*$/i,
  /^receta\s+\d*$/i,
  /^sin\s+t[ií]tulo/i,
];

export function buildPolishPrompt(recipe: {
  title: string;
  slug: string;
  glass: string;
  ingredients: string[];
  method: string;
}): string {
  return `Eres el editor jefe del recetario "Vermut El Travieso". Reescribe y perfecciona esta ficha de cóctel siguiendo el libro de estilo.

${RECIPE_STYLE_SUMMARY}

Receta actual (puede contener errores de importación):
"""
Título: ${recipe.title}
Slug: ${recipe.slug}
Vaso: ${recipe.glass}
Ingredientes:
${recipe.ingredients.map((i) => `- ${i}`).join("\n") || "- (vacío)"}

Método:
${recipe.method || "(vacío)"}
"""

Responde ÚNICAMENTE con JSON válido (sin markdown):
{
  "title": "nombre limpio del cóctel",
  "glass": "vaso genérico en castellano",
  "ingredients": ["45 ml ...", "1 gota de ..."],
  "method": "1. Paso descriptivo.\\n2. Segundo paso.\\n3. ...",
  "abv": "24 %" o "—",
  "summary": "Una frase evocadora del cóctel (máx. 160 caracteres)"
}

Reglas estrictas:
- Mínimo 3 ingredientes con medida (salvo highballs muy simples con 2).
- Método con 4-8 pasos numerados, descriptivos, en español.
- Si faltan ingredientes pero conoces el clásico, complétalos correctamente.
- No inventes marcas de vaso ni dejes texto en inglés en el método.
- Usa Vermut rojo El Travieso / Bitter rojo El Travieso cuando la receta lleve vermut rojo o bitter tipo Campari.`;
}

export function buildAgentStyleAppendix(): string {
  return `\n\nSigue el libro de estilo El Travieso:\n${RECIPE_STYLE_SUMMARY}`;
}
