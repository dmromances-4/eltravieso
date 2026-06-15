/**
 * Biblioteca de prompts cartoon clásico (60s–80s) para El Travieso.
 * Fuente: docs/GUIA-REFERENCIA-ANIMACION.md §3–4
 */

export const CARTOON_POSITIVE_STYLE =
  "1970s-1980s 2D cell animation style, hand-painted background, bold ink outlines, " +
  "solid flat color fills, traditional animation cel";

export const CARTOON_NEGATIVE_PROMPT =
  "3D render, photorealistic, gradient shading, CGI, digital painting, modern anime, vector art, " +
  "text, watermark, signature, copyrighted characters, Dennis the Menace, Daniel el Travieso";

export const TRAVIESO_CARTOON_BRIDGE =
  "El Travieso brand accents #2B87B9 #F9D142 #A62125, mischievous canalla Spanish vermut bar mood, " +
  "original caricature characters only";

export function wrapCartoonPrompt(body: string): string {
  return [body.trim(), CARTOON_POSITIVE_STYLE, TRAVIESO_CARTOON_BRIDGE].filter(Boolean).join(". ");
}

export function promptMaestroPicaro(): string {
  return wrapCartoonPrompt(
    "Character sheet, 1980s 2D cell animation style. A charismatic, mischievous bartender with a thin mustache, " +
      "wearing a classic white vest and a rolled-up blue shirt. Big expressive eyes, single raised eyebrow, cheeky grin. " +
      "Clean black outline, solid color fills, hand-drawn aesthetic. Nostalgic classic cartoon character design, " +
      "isolated on a solid dark background",
  );
}

export function promptTaberneroBonachon(): string {
  return wrapCartoonPrompt(
    "1970s Hanna-Barbera style animation. A burly, friendly bartender with a round nose and thick forearms, " +
      "wearing a red apron. Smiling warmly while wiping a glass with a white cloth. Thick ink outlines, flat vintage colors, " +
      "simplified hand-drawn details. Studio cel style, clean character art",
  );
}

export function promptAgitadoElastico(): string {
  return wrapCartoonPrompt(
    "Dynamic action shot, 1980s television cartoon style. A stylized bartender shaking a metallic cocktail shaker with extreme speed, " +
      "comic smear lines representing rapid movement. The shaker is slightly curved and stretched to emphasize action. " +
      "Sparkles and cartoon sound effects shapes popping around. Solid flat colors, black ink borders, retro cell animation frame",
  );
}

export function promptVertidoPerfecto(glass = "rocks glass", liquidTone = "rich amber-red vermouth"): string {
  return wrapCartoonPrompt(
    `Close-up on hands, 1970s traditional cartoon style. A bartender pouring a stream of ${liquidTone} ` +
      `from a dark glass bottle into a ${glass} filled with a large ice cube and an orange slice. ` +
      "Bold clean outlines, vintage warm color scheme, hand-painted texture background with soft watercolor wash",
  );
}

export function promptExplosionSifon(): string {
  return wrapCartoonPrompt(
    "Comic slapstick scene, 1980s DIC style cartoon. A surprised bartender with wide white eyes and a funny puckered mouth " +
      "as a vintage soda siphon shoots water directly into his face in an exaggerated splash. Cartoon water droplets flying everywhere. " +
      "Flat vibrant colors, clean ink-and-paint aesthetic, expression of funny resignation",
  );
}

export function promptMalabaristaApuros(): string {
  return wrapCartoonPrompt(
    "1970s cartoon comedy scene. A nervous bartender juggling three cocktail glasses, one bottle of vermut, and a lemon twist, " +
      "with sweat drops flying from his forehead. Highly expressive face, elongated cartoon limbs, dynamic silhouette. " +
      "Clean outlines, classic cel shading",
  );
}

export function promptVermuteriaBarrio(): string {
  return wrapCartoonPrompt(
    "Background layout for 2D animation, 1980s style. A cozy, traditional Spanish vermut bar interior. " +
      "Wooden shelves stacked with unlabeled bottles, a retro tap, blackboard menu on the wall, warm ambient lights. " +
      "Hand-painted gouache and watercolor texture, soft brush strokes, simplified cartoon perspective, no people, retro cartoon background plate",
  );
}

export function promptBarraVibrante(): string {
  return wrapCartoonPrompt(
    "Painterly background for a cartoon show, 1970s style. A close-up of a dark wooden bar counter under moody warm lighting, " +
      "with soft yellow and blue highlights. Background shows blurred shapes of bottles and hanging glasses. " +
      "Textured watercolor paper effect, classic cel animation background, warm and nostalgic atmosphere",
  );
}

export function promptSplashVermut(): string {
  return wrapCartoonPrompt(
    "2D animation keyframe set, hand-drawn traditional cell style. An orange slice falling into a glass of red vermut, " +
      "creating a stylized, geometric splash with cartoon liquid crowns. Bold ink lines, flat color fill of deep vermut-red and bright orange, " +
      "vintage paper texture background",
  );
}

export type CartoonBeatKind =
  | "hook"
  | "brand_sting"
  | "spec_card"
  | "ingredients"
  | "technique"
  | "step"
  | "reveal"
  | "outro";

export type CartoonBeatPromptInput = {
  kind: CartoonBeatKind;
  title?: string;
  glass?: string;
  liquidTone?: string;
  garnish?: string;
  technique?: string;
  gag?: string | null;
};

/** Maps cocktail technique to physical gag id used in Remotion + discover JSON. */
export function inferGagFromPrompt(technique?: string): "shaker_pop" | "splash" | "stumble" | "double_take" | null {
  switch (technique) {
    case "shake":
      return "shaker_pop";
    case "muddle":
    case "build":
      return "stumble";
    case "pour":
      return "splash";
    default:
      return null;
  }
}

export function buildCartoonBeatPrompt(input: CartoonBeatPromptInput): string | null {
  switch (input.kind) {
    case "brand_sting":
      return promptMaestroPicaro();
    case "spec_card":
      return promptVertidoPerfecto(input.glass, input.liquidTone);
    case "ingredients":
      return promptBarraVibrante();
    case "technique":
      if (input.gag === "splash") return promptExplosionSifon();
      if (input.technique === "shake") return promptAgitadoElastico();
      if (input.technique === "muddle" || input.gag === "stumble") return promptMalabaristaApuros();
      if (input.technique === "stir" || input.technique === "pour" || input.technique === "strain")
        return promptVertidoPerfecto(input.glass, input.liquidTone);
      return promptAgitadoElastico();
    case "step":
      if (input.gag === "stumble") return promptMalabaristaApuros();
      return promptVertidoPerfecto(input.glass, input.liquidTone);
    case "reveal":
      return promptSplashVermut();
    case "hook":
    case "outro":
      return promptVermuteriaBarrio();
    default:
      return null;
  }
}
