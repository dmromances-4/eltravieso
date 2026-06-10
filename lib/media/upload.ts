import { uploadImageFile } from "@/lib/storage/upload-image";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

async function uploadVideoBuffer(
  buffer: Buffer,
  subdir: string,
  filename: string,
  mime: string,
): Promise<string> {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_EVENT_VIDEOS_BUCKET ?? "event-videos";

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const objectPath = `${subdir}/${filename}`;
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
    if (uploadRes.ok) {
      return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectPath}`;
    }
  }

  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${subdir}/${filename}`;
}

export async function uploadMediaCover(userId: string, file: File) {
  return uploadImageFile(file, {
    userId,
    subdir: "media-covers",
    bucket: process.env.SUPABASE_MEDIA_COVERS_BUCKET ?? process.env.SUPABASE_BUCKET ?? "media-covers",
  });
}

export async function uploadEventVideo(userId: string, file: File) {
  if (!VIDEO_TYPES.has(file.type)) {
    throw new Error("Formato no válido. Usa MP4 o WebM.");
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error("El vídeo no puede superar 100 MB.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type.includes("webm") ? "webm" : "mp4";
  const filename = `${userId}-${Date.now()}.${ext}`;
  return uploadVideoBuffer(buffer, "event-videos", filename, file.type);
}

export async function checkLiveEmbedUrl(url: string) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.ok;
  } catch {
    return false;
  }
}
