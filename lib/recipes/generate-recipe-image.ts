import { generateImage } from "@/lib/ai/provider";
import { isDevelopmentMockEnabled } from "@/lib/ai/availability";
import { buildBrandedCoverSvg } from "@/lib/recipes/branded-cover-svg";
import { buildRecipeImagePrompt, type RecipeImageInput } from "@/lib/recipes/image-prompt";
import { uploadRecipeCoverBuffer } from "@/lib/storage/upload-image";

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL from image generator");
  return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
}

async function fetchUrlToBuffer(url: string): Promise<{ buffer: Buffer; mime: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const mime = res.headers.get("content-type") ?? "image/png";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, mime };
}

export async function generateAndUploadRecipeCover(
  slug: string,
  input: RecipeImageInput,
): Promise<string> {
  let buffer: Buffer;
  let mime: string;

  if (isDevelopmentMockEnabled()) {
    const svg = buildBrandedCoverSvg(input);
    buffer = Buffer.from(svg, "utf-8");
    mime = "image/svg+xml";
  } else {
    const prompt = buildRecipeImagePrompt(input);
    const { url } = await generateImage(prompt);

    if (url.startsWith("data:")) {
      ({ buffer, mime } = dataUrlToBuffer(url));
    } else {
      ({ buffer, mime } = await fetchUrlToBuffer(url));
    }
  }

  return uploadRecipeCoverBuffer(slug, buffer, mime);
}
