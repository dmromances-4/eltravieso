import { createHash } from "crypto";

export function buildWebhookDedupeId(source: string, rawBody: string, suffix = ""): string {
  const hash = createHash("sha256").update(`${source}:${suffix}:${rawBody}`).digest("hex");
  return `${source}:${hash.slice(0, 32)}`;
}
