import { createHmac, timingSafeEqual } from "crypto";

export function verifyTpvSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !secret) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (sigBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    const expectedBase64 = createHmac("sha256", secret).update(rawBody).digest("base64");
    return signature === expected || signature === expectedBase64;
  }
}
