import { readFile, writeFile } from "fs/promises";
import path from "path";
import { writeCoverManifest } from "@/lib/recipes/cover-manifest";
import { uploadRecipeCoverBuffer } from "@/lib/storage/upload-image";
import type { CocktailRecord } from "@/types/cocktail";

const COCKTAILS_PATH = path.join(process.cwd(), "data/cocktails.json");

async function loadStaticRecipes(): Promise<CocktailRecord[]> {
  const raw = await readFile(COCKTAILS_PATH, "utf-8");
  return JSON.parse(raw) as CocktailRecord[];
}

async function saveStaticRecipes(recipes: CocktailRecord[]) {
  await writeFile(COCKTAILS_PATH, `${JSON.stringify(recipes, null, 2)}\n`, "utf-8");
}

export async function applyStockCoverFromUrl(
  slug: string,
  title: string,
  stockUrl: string,
  attribution?: string,
): Promise<{ imageUrl: string; attribution?: string }> {
  const res = await fetch(stockUrl);
  if (!res.ok) throw new Error(`Failed to fetch stock image: ${res.status}`);
  const mime = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  const imageUrl = await uploadRecipeCoverBuffer(slug, buffer, mime);

  const staticRecipes = await loadStaticRecipes();
  const idx = staticRecipes.findIndex((r) => r.slug === slug);
  if (idx >= 0) {
    staticRecipes[idx] = {
      ...staticRecipes[idx],
      cover: imageUrl,
      ...(attribution ? { coverAttribution: attribution } : {}),
    };
    await saveStaticRecipes(staticRecipes);
  }

  await writeCoverManifest({
    slug,
    title,
    updatedAt: new Date().toISOString(),
    strategy: "free_stock",
    coverUrl: imageUrl,
    referenceUrl: stockUrl,
    attribution,
  });

  return { imageUrl, attribution };
}
