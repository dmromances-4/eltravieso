import { uploadImageFile } from "@/lib/storage/upload-image";
import { resolveVideoBucket, uploadObjectBuffer } from "@/lib/storage/object-storage";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

async function uploadVideoBuffer(
  buffer: Buffer,
  subdir: string,
  filename: string,
  mime: string,
): Promise<string> {
  const bucket = resolveVideoBucket("event");
  return uploadObjectBuffer({
    buffer,
    mime,
    folder: subdir,
    filename,
    bucket,
    localSubdir: subdir,
  });
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
