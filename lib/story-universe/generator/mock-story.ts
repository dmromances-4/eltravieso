import type { CocktailNarrativeProfile, StoryDraft, UniverseCategory } from "../types";

export function buildMockStoryDraft(input: {
  profile: CocktailNarrativeProfile;
  category: UniverseCategory;
  storyIndex: number;
  storyId: string;
}): StoryDraft {
  const { profile, category, storyId, storyIndex } = input;
  const names = ["Leo", "Rosa", "Tomás", "Nadia", "Vicente"];
  const name = names[storyIndex % names.length]!;

  return {
    storyId,
    title: `${profile.cocktailTitle} y la última apuesta`,
    logline: `${name} entra a un bar de barrio con un ${profile.cocktailTitle} en mente; la noche ${profile.personality[0] ?? "misteriosa"} termina con ${profile.symbolism[0] ?? "un brindis"} y una verdad incómoda.`,
    theme: category.label,
    subthemes: profile.personality.slice(0, 2),
    cocktailReference: profile.cocktailSlug,
    emotionProfile: { melancolía: 0.75, humor_negro: 0.4, esperanza: 0.15 },
    characterList: [
      { name, role: "protagonista", archetype: "fracasado_entranable", motivation: profile.narrativeHooks[0] ?? "un trago de paz" },
      { name: "El camarero", role: "mentor cínico", archetype: "camarero_filosofo", motivation: "servir sin juzgar" },
    ],
    locations: [
      { name: "Bar El Travieso", atmosphere: "neón amarillo y madera húmeda" },
      { name: "Calle de lluvia", atmosphere: "reflejos urbanos" },
    ],
    conflict: {
      type: "auto_sabotaje",
      description: `${name} no puede aceptar una segunda oportunidad`,
      stakes: "perder la última amistad honesta",
    },
    resolution: {
      type: "ironía_amarga",
      description: `Se va con el sabor ${profile.tasteProfile[0] ?? "amargo"} del ${profile.cocktailTitle} y una sonrisa rota`,
    },
    visualIdentity: {
      palette: ["#F9D142", "#2B87B9", "#A62125", "#1a1a1a"],
      lighting: "contraluz de bar",
      era: "urbano contemporáneo",
      mood: profile.personality.join(", ") || "melancólico",
    },
    animationPotential: 0.78 + (storyIndex % 5) * 0.04,
    categoryId: category.id,
  };
}
