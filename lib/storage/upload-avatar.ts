import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

async function uploadToSupabase(buffer: Buffer, userId: string, mime: string): Promise<string | null> {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_AVATARS_BUCKET ?? process.env.SUPABASE_BUCKET ?? "avatars";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  const ext = extensionForMime(mime);
  const filename = `avatars/${userId}/${Date.now()}.${ext}`;

  const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${filename}`, {
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
    console.error("Supabase avatar upload failed:", await uploadRes.text());
    return null;
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`;
}

async function uploadToLocal(buffer: Buffer, userId: string, mime: string): Promise<string> {
  const ext = extensionForMime(mime);
  const dir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(dir, { recursive: true });
  const filename = `${userId}-${Date.now()}.${ext}`;
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/avatars/${filename}`;
}

export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Formato no válido. Usa JPG, PNG, WebP o GIF.");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("La imagen no puede superar 5 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const remote = await uploadToSupabase(buffer, userId, file.type);
  if (remote) return remote;

  return uploadToLocal(buffer, userId, file.type);
}
