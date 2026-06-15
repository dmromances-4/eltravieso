import { analyzeImageForRecipeCover, generateFreeImage } from "@/lib/ai/provider";
import { fetchWithTimeout } from "@/lib/recipes/fetch-with-timeout";
import { isDevelopmentMockEnabled } from "@/lib/ai/availability";
import { discoverCoverCandidates } from "@/lib/recipes/cover-discovery";
import { writeCoverManifest, type CoverManifestStrategy } from "@/lib/recipes/cover-manifest";
import {
  pickBestFreeStock,
  pickBestReference,
  scoreCoverCandidates,
} from "@/lib/recipes/cover-reference";
import { isGrayZoneScore, visionRankStockCandidates } from "@/lib/recipes/cover-vision-rank";
import { buildBrandedCoverSvg } from "@/lib/recipes/branded-cover-svg";
import {
  buildRecipeImagePrompt,
  buildRecipeImagePromptFromReference,
  buildReferenceAnalysisPrompt,
  type RecipeImageInput,
} from "@/lib/recipes/image-prompt";
import { uploadRecipeCoverBuffer } from "@/lib/storage/upload-image";

export type CoverStrategy = "auto" | "stock" | "ai";

export type ResolveRecipeCoverOptions = {
  strategy?: CoverStrategy;
  discoverOnly?: boolean;
};

export type ResolveRecipeCoverResult = {
  imageUrl?: string;
  strategy: CoverManifestStrategy | "discover_only";
  referenceUrl?: string;
  attribution?: string;
  candidates?: ReturnType<typeof scoreCoverCandidates>;
};

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL from image generator");
  return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
}

async function fetchUrlToBuffer(url: string): Promise<{ buffer: Buffer; mime: string }> {
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const mime = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, mime };
}

async function imageResponseToBuffer(response: { url: string }): Promise<{ buffer: Buffer; mime: string }> {
  if (response.url.startsWith("data:")) {
    return dataUrlToBuffer(response.url);
  }
  return fetchUrlToBuffer(response.url);
}

async function generateWithOptionalReference(
  slug: string,
  input: RecipeImageInput,
  reference?: { url: string },
): Promise<{ buffer: Buffer; mime: string; strategy: CoverManifestStrategy; referenceUrl?: string }> {
  if (reference?.url) {
    try {
      const { buffer: refBuffer, mime: refMime } = await fetchUrlToBuffer(reference.url);
      const analysisPrompt = buildReferenceAnalysisPrompt(input);
      const { text } = await analyzeImageForRecipeCover(refBuffer, analysisPrompt, refMime);
      const referenceDescription = text.trim();
      const prompt = referenceDescription
        ? buildRecipeImagePromptFromReference(input, referenceDescription)
        : buildRecipeImagePrompt(input);

      const response = await generateFreeImage(prompt);
      const { buffer, mime } = await imageResponseToBuffer(response);
      return { buffer, mime, strategy: "ai_reference", referenceUrl: reference.url };
    } catch (error) {
      console.warn(`[cover] Reference-based generation failed for ${slug}:`, error instanceof Error ? error.message : error);
    }
  }

  const prompt = buildRecipeImagePrompt(input);
  const response = await generateFreeImage(prompt);
  const { buffer, mime } = await imageResponseToBuffer(response);
  return { buffer, mime, strategy: "ai_text" };
}

export async function resolveRecipeCover(
  slug: string,
  input: RecipeImageInput,
  options: ResolveRecipeCoverOptions = {},
): Promise<ResolveRecipeCoverResult> {
  const strategy = options.strategy ?? "auto";
  const skipDiffordsReference = strategy === "stock";
  let candidates = scoreCoverCandidates(
    await discoverCoverCandidates(input, {
      sourceUrl: skipDiffordsReference ? undefined : input.sourceUrl,
    }),
    input,
  );

  const topStock = candidates.find((c) => c.license === "free_stock");
  if (!options.discoverOnly && topStock && isGrayZoneScore(topStock.score)) {
    candidates = await visionRankStockCandidates(candidates, input);
  }

  if (options.discoverOnly) {
    await writeCoverManifest({
      slug,
      title: input.title,
      updatedAt: new Date().toISOString(),
      candidates,
    });
    return { strategy: "discover_only", candidates };
  }

  if (isDevelopmentMockEnabled()) {
    const svg = buildBrandedCoverSvg(input);
    const buffer = Buffer.from(svg, "utf-8");
    const imageUrl = await uploadRecipeCoverBuffer(slug, buffer, "image/svg+xml");
    await writeCoverManifest({
      slug,
      title: input.title,
      updatedAt: new Date().toISOString(),
      strategy: "ai_text",
      coverUrl: imageUrl,
      notes: "AI_MOCK SVG placeholder",
      candidates,
    });
    return { imageUrl, strategy: "ai_text", candidates };
  }

  const bestStock = pickBestFreeStock(candidates);
  if ((strategy === "auto" || strategy === "stock") && bestStock) {
    const { buffer, mime } = await fetchUrlToBuffer(bestStock.url);
    const imageUrl = await uploadRecipeCoverBuffer(slug, buffer, mime);
    await writeCoverManifest({
      slug,
      title: input.title,
      updatedAt: new Date().toISOString(),
      strategy: "free_stock",
      coverUrl: imageUrl,
      referenceUrl: bestStock.url,
      attribution: bestStock.attribution,
      candidates,
    });
    return {
      imageUrl,
      strategy: "free_stock",
      referenceUrl: bestStock.url,
      attribution: bestStock.attribution,
      candidates,
    };
  }

  if (strategy === "stock" && !bestStock) {
    throw new Error(`No free stock match above threshold for "${input.title}".`);
  }

  const reference = pickBestReference(candidates);
  const generated = await generateWithOptionalReference(slug, input, reference ?? undefined);
  const imageUrl = await uploadRecipeCoverBuffer(slug, generated.buffer, generated.mime);

  await writeCoverManifest({
    slug,
    title: input.title,
    updatedAt: new Date().toISOString(),
    strategy: generated.strategy,
    coverUrl: imageUrl,
    referenceUrl: generated.referenceUrl ?? reference?.url,
    candidates,
  });

  return {
    imageUrl,
    strategy: generated.strategy,
    referenceUrl: generated.referenceUrl ?? reference?.url,
    candidates,
  };
}

/** Backward-compatible wrapper used by API routes and agent. */
export async function generateAndUploadRecipeCover(
  slug: string,
  input: RecipeImageInput,
  options: ResolveRecipeCoverOptions = {},
): Promise<string> {
  const result = await resolveRecipeCover(slug, input, options);
  if (!result.imageUrl) {
    throw new Error(`Cover resolution did not produce an image for "${slug}".`);
  }
  return result.imageUrl;
}

/** Import a local image file (e.g. downloaded from Pexels/Unsplash). */
export async function importRecipeCoverFromFile(
  slug: string,
  filePath: string,
  title: string,
): Promise<string> {
  const { readFile } = await import("fs/promises");
  const pathMod = await import("path");
  const buffer = await readFile(filePath);
  const ext = pathMod.extname(filePath).toLowerCase();
  const mime =
    ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/jpeg";
  const imageUrl = await uploadRecipeCoverBuffer(slug, buffer, mime);
  await writeCoverManifest({
    slug,
    title,
    updatedAt: new Date().toISOString(),
    strategy: "manual_import",
    coverUrl: imageUrl,
    notes: `Imported from ${filePath}`,
  });
  return imageUrl;
}
