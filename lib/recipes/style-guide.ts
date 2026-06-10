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
  // --- Fase 1: Limpiar prefijos descriptivos ---
  [/^Photographed in (?:a|an)\s+/i, ""],
  [/^Serve in (?:a|an)\s+/i, ""],
  [/^(?:an|a)\s+/i, ""],

  // --- Fase 2: Marcas comerciales de cristalería → genérico ---
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

  // --- Fase 3: Variantes UB (Urban Bar abreviado) ---
  [/UB\s+1910[^,]*old\s*fashioned[^,]*/gi, "Vaso old fashioned"],
  [/UB\s+1910[^,]*/gi, "Copa de autor"],
  [/UB\s+Koto[^,]*old\s*fashioned[^,]*/gi, "Vaso old fashioned"],
  [/UB\s+Koto[^,]*/gi, "Copa de autor"],
  [/UB\s+Nick\s+And\s+Nora[^,]*/gi, "Copa Nick & Nora"],
  [/UB\s+Retro\s+Coupe[^,]*/gi, "Copa coupe"],
  [/UB\s+Retro[^,]*/gi, "Copa coupe"],
  [/UB\s+[A-Z][^,]*/g, "Copa de autor"],

  // --- Fase 4: Urban Bar (nombre completo) ---
  [/Urban\s+Bar[^,]*Old\s+Fashioned[^,]*/gi, "Vaso old fashioned"],
  [/Urban\s+Bar[^,]*Alto\s+Coupe[^,]*/gi, "Copa coupe"],
  [/Urban\s+Bar[^,]*Coupe[^,]*/gi, "Copa coupe"],
  [/Urban\s+Bar[^,]*Fluet[^,]*/gi, "Vaso old fashioned"],
  [/Urban\s+Bar[^,]*Flute[^,]*/gi, "Copa flute"],
  [/Urban\s+Bar[^,]*Highball[^,]*/gi, "Vaso highball"],
  [/Urban\s+Bar[^,]*Collins[^,]*/gi, "Vaso collins"],
  [/Urban\s+Bar[^,]*Nick[^,]*Nora[^,]*/gi, "Copa Nick & Nora"],
  [/Urban\s+Bar[^,]*/gi, "Copa de autor"],

  // --- Fase 5: Repeticiones ("Vaso Vaso Vaso old fashioned", "Copa Copa Copa Nick & Nora") ---
  [/(?:Vaso\s+){2,}old\s+fashioned/gi, "Vaso old fashioned"],
  [/(?:Copa\s+){2,}Nick\s*&?\s*Nora(?:\s+glass)?/gi, "Copa Nick & Nora"],
  [/(?:Copa\s+){2,}(coupe|flute|martini)/gi, "Copa $1"],

  // --- Fase 6: Nombres en inglés → español ---
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

export const INGREDIENT_CLEANUP: [RegExp, string][] = [
  // --- Eliminación de adjetivos de temperatura/frescura en inglés ---
  [/\s+chilled\b/gi, ""],
  [/\s+from freezer\b/gi, ""],
  [/\s*\(freshly squeezed\)/gi, " recién exprimido"],
  [/\s*\(freshly-squeezed\)/gi, " recién exprimido"],
  [/\s*\(chilled\)/gi, ""],

  // --- Vermouths genéricos → marca propia ---
  [/\bRosso\/sweet vermouth\b/gi, "Vermut rojo El Travieso"],
  [/\bSweet vermouth\b/gi, "Vermut rojo El Travieso"],
  [/\bDry vermouth\b/gi, "Vermut seco"],
  [/\bBianco vermouth\b/gi, "Vermut bianco"],
  [/\bExtra-?dry vermouth\b/gi, "Vermut extra seco"],

  // --- Zumos ---
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

  // --- Siropes ---
  [/\bSugar syrup 'rich'[^)]*\)/gi, "Sirope de azúcar rico (2:1)"],
  [/\bSugar syrup\b/gi, "Sirope de azúcar"],
  [/\bSimple syrup\b/gi, "Sirope de azúcar"],
  [/\bHoney syrup\b/gi, "Sirope de miel"],
  [/\bAgave syrup\b/gi, "Sirope de agave"],
  [/\bOrgeat\b/gi, "Orgeat (sirope de almendra)"],
  [/\bFalernum\b/gi, "Falernum"],
  [/\bGrenadine\b/gi, "Granadina"],

  // --- Café ---
  [/\bExprè Caffè Italiano[^)]*\)/gi, "Café espresso italiano recién hecho"],
  [/\bExprè Caffè Italiano\b/gi, "Café espresso italiano"],
  [/\bfreshly made hot Espresso Coffee\b/gi, "café espresso caliente recién hecho"],

  // --- Refrescos y aguas ---
  [/\bThomas Henry Soda Water\b/gi, "Agua con gas"],
  [/\bSoda Water\b/gi, "Agua con gas"],
  [/\bClub soda\b/gi, "Agua con gas"],
  [/\bTonic Water\b/gi, "Tónica"],
  [/\bTonic water\b/gi, "Tónica"],
  [/\bGinger Beer\b/gi, "Ginger beer"],
  [/\bGinger beer\b/gi, "Ginger beer"],

  // --- Espirituosos y licores ---
  [/\bBourbon whiskey\b/gi, "Bourbon"],
  [/\bStraight rye whiskey[^)]*\)/gi, "Rye whiskey 50 % vol."],
  [/\bRye whiskey\b/gi, "Rye whiskey"],
  [/\bBlended Scotch whisky\b/gi, "Whisky escocés blended"],
  [/\bIrish whiskey\b/gi, "Irish whiskey"],
  [/\bLight white rum[^)]*\)/gi, "Ron blanco"],
  [/\bWhite rum\b/gi, "Ron blanco"],
  [/\bDark rum\b/gi, "Ron oscuro"],
  [/\bAged rum\b/gi, "Ron añejo"],
  [/\bCognac\b/g, "Cognac"],
  [/\bTequila\b/g, "Tequila"],
  [/\bMezcal\b/g, "Mezcal"],
  [/\bAbsinthe\b/gi, "Absenta"],
  [/\bElderflower\s+liqueur\b/gi, "Licor de flor de saúco"],
  [/\bElderflower\b/gi, "Flor de saúco"],
  [/\bMaraschino\s+liqueur\b/gi, "Licor Maraschino"],
  [/\bMaraschino\b/gi, "Maraschino"],

  // --- Otros ingredientes ---
  [/\bEgg white\b/gi, "Clara de huevo"],
  [/\bDouble cream\b/gi, "Nata para montar"],
  [/\bHeavy cream\b/gi, "Nata para montar"],
  [/\bCoconut cream\b/gi, "Crema de coco"],

  // --- Ginebras ---
  [/\bHayman's London Dry Gin\b/gi, "Ginebra Hayman's London Dry"],
  [/\bLondon Dry Gin\b/gi, "Ginebra London Dry"],

  // --- Bitters ---
  [/\bOrange Bitters by Angostura\b/gi, "Angostura Orange Bitters"],
  [/\bAngostura Aromatic Bitters\b/gi, "Angostura Bitters"],
  [/\bPeychaud's or other Creole-style bitters\b/gi, "Peychaud's Bitters"],
  [/\bBoker's style bitters\b/gi, "Bitters estilo Boker's"],
  [/\bBob's Chocolate bitters\b/gi, "Bitters de chocolate"],
  [/\bCreole bitters\b/gi, "Peychaud's Bitters"],

  // --- Unidades y formato ---
  [/\b(\d+)\s+drop\b/gi, "$1 gotas de"],
  [/\b(\d+)\s+dash(?:es)?\b/gi, "$1 gotas de"],
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
