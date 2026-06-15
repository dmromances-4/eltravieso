import prisma from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { loadCocktails } from "@/lib/recipes/cocktails-io";
import { appendStoryUniverseChangelog } from "../changelog";
import { buildAllCocktailProfiles } from "./build-profile";
import { COCKTAIL_PROFILES_PATH } from "../paths";
import type { CocktailNarrativeProfile } from "../types";

export async function persistCocktailProfiles(profiles: CocktailNarrativeProfile[]): Promise<number> {
  let upserted = 0;
  for (const p of profiles) {
    await prisma.cocktailNarrativeProfile.upsert({
      where: { cocktailSlug: p.cocktailSlug },
      create: {
        cocktailSlug: p.cocktailSlug,
        cocktailTitle: p.cocktailTitle,
        aromaticProfile: p.aromaticProfile,
        tasteProfile: p.tasteProfile,
        color: p.color,
        intensity: p.intensity,
        personality: p.personality,
        symbolism: p.symbolism,
        evokedSensations: p.evokedSensations,
        narrativeHooks: p.narrativeHooks,
        originHint: p.originHint,
      },
      update: {
        cocktailTitle: p.cocktailTitle,
        aromaticProfile: p.aromaticProfile,
        tasteProfile: p.tasteProfile,
        color: p.color,
        intensity: p.intensity,
        personality: p.personality,
        symbolism: p.symbolism,
        evokedSensations: p.evokedSensations,
        narrativeHooks: p.narrativeHooks,
        originHint: p.originHint,
      },
    });
    upserted += 1;
  }
  return upserted;
}

export async function runBuildCocktailProfiles(opts: {
  limit?: number;
  slug?: string;
  dryRun?: boolean;
}): Promise<{ count: number; path: string }> {
  const cocktails = await loadCocktails();
  let list = cocktails;
  if (opts.slug) list = list.filter((c) => c.slug === opts.slug);
  if (opts.limit) list = list.slice(0, opts.limit);

  const profiles = buildAllCocktailProfiles(list);
  await writeFile(COCKTAIL_PROFILES_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), profiles }, null, 2), "utf8");

  if (!opts.dryRun) {
    await persistCocktailProfiles(profiles);
  }

  await appendStoryUniverseChangelog(`build-cocktail-profiles: ${profiles.length} perfiles`);
  return { count: profiles.length, path: COCKTAIL_PROFILES_PATH };
}
