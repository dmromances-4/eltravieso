#!/usr/bin/env tsx
/**
 * Populate data/i18n/en/cocktails.json with stub entries for every cocktail
 * in data/cocktails.json. Preserves existing AI-translated sidecar entries.
 *
 *   npm run seed:en-cocktails
 */

import fs from "fs";
import path from "path";
import { loadCocktails } from "@/lib/recipes/cocktails-io";
import type { LocalizedCocktailFields } from "@/lib/i18n/content";

const SIDECAR_PATH = path.join(process.cwd(), "data", "i18n", "en", "cocktails.json");

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function loadExistingSidecar(): Record<string, LocalizedCocktailFields> {
  if (!fs.existsSync(SIDECAR_PATH)) return {};
  return JSON.parse(fs.readFileSync(SIDECAR_PATH, "utf8")) as Record<string, LocalizedCocktailFields>;
}

function stubFromSource(recipe: ReturnType<typeof loadCocktails>[number]): LocalizedCocktailFields {
  return {
    title: humanizeSlug(recipe.slug),
    glass: recipe.glass,
    ingredients: recipe.ingredients,
    method: recipe.method,
  };
}

function main() {
  const cocktails = loadCocktails("es");
  const sidecar = loadExistingSidecar();
  const existingCount = Object.keys(sidecar).length;
  let added = 0;

  for (const recipe of cocktails) {
    if (sidecar[recipe.slug]) continue;
    sidecar[recipe.slug] = stubFromSource(recipe);
    added += 1;
  }

  const sorted = Object.fromEntries(
    Object.keys(sidecar)
      .sort((a, b) => a.localeCompare(b))
      .map((slug) => [slug, sidecar[slug]]),
  );

  fs.mkdirSync(path.dirname(SIDECAR_PATH), { recursive: true });
  fs.writeFileSync(SIDECAR_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");

  const total = Object.keys(sorted).length;
  console.log(`Cocktails in source: ${cocktails.length}`);
  console.log(`Existing sidecar entries preserved: ${existingCount}`);
  console.log(`New stub entries added: ${added}`);
  console.log(`Total entries in ${SIDECAR_PATH}: ${total}`);
}

main();
