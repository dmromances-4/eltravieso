import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { assertAllowedUserImage, extensionForDetectedMime } from "./magic-bytes";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionForMime(mime: string) {
  return extensionForDetectedMime(mime);
}

async function uploadToSupabase(
  buffer: Buffer,
  folder: string,
  filename: string,
  mime: string,
  bucket: string,
): Promise<string | null> {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  const objectPath = `${folder}/${filename}`;

  const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": mime,
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!uploadRes.ok) {
    console.error("Supabase upload failed:", await uploadRes.text());
    return null;
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectPath}`;
}

async function uploadToLocal(buffer: Buffer, subdir: string, filename: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${subdir}/${filename}`;
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

  const remote = await uploadToSupabase(buffer, "covers", filename, mime, bucket);
  if (remote) return remote;

  return uploadToLocal(buffer, "recipe-covers", filename);
}

export async function uploadRecipeVideoBuffer(
  slug: string,
  buffer: Buffer,
  mime = "video/mp4",
): Promise<string> {
  const filename = `${slug}.mp4`;
  const bucket = process.env.SUPABASE_RECIPE_VIDEOS_BUCKET ?? "recipe-videos";

  const remote = await uploadToSupabase(buffer, "videos", filename, mime, bucket);
  if (remote) return remote;

  return uploadToLocal(buffer, "recipe-videos", filename);
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

  const remote = await uploadToSupabase(buffer, options.subdir, filename, verifiedMime, bucket);
  if (remote) return remote;

  return uploadToLocal(buffer, options.subdir, filename);
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
