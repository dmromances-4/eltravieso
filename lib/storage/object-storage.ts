/**
 * Object storage — Supabase REST (legacy) or S3-compatible (Cloudflare R2).
 * Set STORAGE_PROVIDER=r2 and R2_* vars for cheap video hosting (zero egress).
 */

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type StorageProvider = "supabase" | "r2" | "local";

export function getStorageProvider(): StorageProvider {
  const raw = (process.env.STORAGE_PROVIDER ?? "supabase").toLowerCase();
  if (raw === "r2" || raw === "s3") {
    if (
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_PUBLIC_URL
    ) {
      return "r2";
    }
    console.warn("[storage] STORAGE_PROVIDER=r2 but R2_* incomplete — fallback supabase/local");
  }
  return "supabase";
}

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = new S3Client({
      region: process.env.R2_REGION ?? "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return r2Client;
}

async function uploadToR2(
  buffer: Buffer,
  objectKey: string,
  mime: string,
  bucket: string,
): Promise<string | null> {
  try {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: buffer,
        ContentType: mime,
      }),
    );
    const publicBase = process.env.R2_PUBLIC_URL!.replace(/\/$/, "");
    return `${publicBase}/${objectKey}`;
  } catch (err) {
    console.error("[storage] R2 upload error:", err);
    return null;
  }
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
    console.error("[storage] Supabase upload failed:", await uploadRes.text());
    return null;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectPath}`;
}

export async function uploadObjectBuffer(options: {
  buffer: Buffer;
  mime: string;
  folder: string;
  filename: string;
  bucket: string;
  localSubdir: string;
}): Promise<string> {
  const { buffer, mime, folder, filename, bucket, localSubdir } = options;
  const provider = getStorageProvider();

  if (provider === "r2") {
    const objectKey = `${folder}/${filename}`;
    const remote = await uploadToR2(buffer, objectKey, mime, bucket);
    if (remote) return remote;
  } else {
    const remote = await uploadToSupabase(buffer, folder, filename, mime, bucket);
    if (remote) return remote;
  }

  const { mkdir, writeFile } = await import("fs/promises");
  const pathMod = await import("path");
  const dir = pathMod.join(process.cwd(), "public", "uploads", localSubdir);
  await mkdir(dir, { recursive: true });
  await writeFile(pathMod.join(dir, filename), buffer);
  return `/uploads/${localSubdir}/${filename}`;
}

export function resolveVideoBucket(kind: "recipe" | "story" | "event" | "media"): string {
  if (getStorageProvider() === "r2") {
    const map: Record<string, string | undefined> = {
      recipe: process.env.R2_RECIPE_VIDEOS_BUCKET,
      story: process.env.R2_STORY_EPISODES_BUCKET,
      event: process.env.R2_MEDIA_BUCKET,
      media: process.env.R2_MEDIA_BUCKET,
    };
    return map[kind] ?? process.env.R2_DEFAULT_BUCKET ?? "eltravieso-media";
  }
  const supabaseMap: Record<string, string | undefined> = {
    recipe: process.env.SUPABASE_RECIPE_VIDEOS_BUCKET,
    story: process.env.SUPABASE_STORY_EPISODES_BUCKET,
    event: process.env.SUPABASE_EVENT_VIDEOS_BUCKET,
    media: process.env.SUPABASE_MEDIA_COVERS_BUCKET,
  };
  return supabaseMap[kind] ?? "recipe-videos";
}
