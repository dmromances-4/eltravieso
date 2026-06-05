import crypto from "crypto";

const DEFAULT_SECRET = "dev-marketing-unsubscribe-secret-change-me";

function secret() {
  return process.env.MARKETING_UNSUBSCRIBE_SECRET ?? DEFAULT_SECRET;
}

export function createUnsubscribeToken(userId: string) {
  const sig = crypto.createHmac("sha256", secret()).update(userId).digest("hex");
  return Buffer.from(`${userId}:${sig}`).toString("base64url");
}

export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const idx = decoded.lastIndexOf(":");
    if (idx <= 0) return null;
    const userId = decoded.slice(0, idx);
    const sig = decoded.slice(idx + 1);
    const expected = crypto.createHmac("sha256", secret()).update(userId).digest("hex");
    if (sig.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return userId;
  } catch {
    return null;
  }
}

export function unsubscribeUrl(userId: string, baseUrl?: string) {
  const base = (baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const token = createUnsubscribeToken(userId);
  return `${base}/api/marketing/unsubscribe?token=${encodeURIComponent(token)}`;
}
