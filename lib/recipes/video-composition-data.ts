export type RecipeVideoProps = {
  title: string;
  glass: string;
  ingredients: string[];
  steps: string[];
  coverImageUrl?: string;
  mascotPose?: "idle" | "stir" | "pour" | "shake" | "present";
};

export function inferMascotPose(method: string): RecipeVideoProps["mascotPose"] {
  const m = method.toLowerCase();
  if (m.includes("shake")) return "shake";
  if (m.includes("stir")) return "stir";
  if (m.includes("pour") || m.includes("build")) return "pour";
  return "present";
}

export function methodToSteps(method: string): string[] {
  return method
    .split(/\n|(?=\d+\.\s)/)
    .map((s) => s.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

export function recipeToVideoProps(input: {
  title: string;
  glass: string;
  ingredients: string[];
  method: string;
  coverImageUrl?: string;
}): RecipeVideoProps {
  return {
    title: input.title,
    glass: input.glass,
    ingredients: input.ingredients.slice(0, 8),
    steps: methodToSteps(input.method).slice(0, 6),
    coverImageUrl: input.coverImageUrl,
    mascotPose: inferMascotPose(input.method),
  };
}
