const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  if (buffer.toString("ascii", 0, 3) === "GIF") {
    return "image/gif";
  }

  return null;
}

export function extensionForDetectedMime(mime: string) {
  return MIME_TO_EXT[mime] ?? "jpg";
}

export function assertAllowedUserImage(buffer: Buffer, declaredMime: string): string {
  if (!ALLOWED.has(declaredMime)) {
    throw new Error("Formato no válido. Usa JPG, PNG, WebP o GIF.");
  }

  const detected = detectImageMime(buffer);
  if (!detected || !ALLOWED.has(detected)) {
    throw new Error("El archivo no es una imagen válida (JPG, PNG, WebP o GIF).");
  }

  return detected;
}
