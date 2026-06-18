import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { assertAllowedUserImage, extensionForDetectedMime } from "./magic-bytes";
import { resolveVideoBucket, uploadObjectBuffer } from "./object-storage";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionForMime(mime: string) {
  return extensionForDetectedMime(mime);
}

function extensionForMimeOrDefault(mime: string, fallback = "png") {
  if (mime.includes("svg")) return "svg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("mp4")) return "mp4";
  return fallback;
}

export async function uploadRecipeCoverBuffer(
  slug: string,
  buffer: Buffer,
  mime = "image/png",
): Promise<string> {
  const ext = extensionForMimeOrDefault(mime);
  const filename = `${slug}.${ext}`;
  const bucket = process.env.SUPABASE_RECIPE_COVERS_BUCKET ?? "recipe-covers";

  return uploadObjectBuffer({
    buffer,
    mime,
    folder: "covers",
    filename,
    bucket,
    localSubdir: "recipe-covers",
  });
}

export async function uploadRecipeVideoBuffer(
  slug: string,
  buffer: Buffer,
  mime = "video/mp4",
): Promise<string> {
  const filename = `${slug}.mp4`;
  const bucket = resolveVideoBucket("recipe");

  return uploadObjectBuffer({
    buffer,
    mime,
    folder: "videos",
    filename,
    bucket,
    localSubdir: "recipe-videos",
  });
}

export async function uploadStoryEpisodeBuffer(
  storyId: string,
  buffer: Buffer,
  mime = "video/mp4",
): Promise<string> {
  const filename = `${storyId}.mp4`;
  const bucket = resolveVideoBucket("story");

  return uploadObjectBuffer({
    buffer,
    mime,
    folder: "episodes",
    filename,
    bucket,
    localSubdir: "story-episodes",
  });
}

export async function uploadImageFile(
  file: File,
  options: { userId: string; subdir: string; bucket?: string },
): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Formato no válido. Usa JPG, PNG, WebP o GIF.");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("La imagen no puede superar 5 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const verifiedMime = assertAllowedUserImage(buffer, file.type);
  const ext = extensionForMime(verifiedMime);
  const filename = `${options.userId}-${Date.now()}.${ext}`;
  const bucket = options.bucket ?? process.env.SUPABASE_BUCKET ?? "uploads";

  return uploadObjectBuffer({
    buffer,
    mime: verifiedMime,
    folder: options.subdir,
    filename,
    bucket,
    localSubdir: options.subdir,
  });
}

export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  return uploadImageFile(file, {
    userId,
    subdir: "avatars",
    bucket: process.env.SUPABASE_AVATARS_BUCKET ?? process.env.SUPABASE_BUCKET ?? "avatars",
  });
}

export async function uploadBlogCover(userId: string, file: File): Promise<string> {
  return uploadImageFile(file, {
    userId,
    subdir: "blog-covers",
    bucket: process.env.SUPABASE_BLOG_BUCKET ?? process.env.SUPABASE_BUCKET ?? "blog-covers",
  });
}
