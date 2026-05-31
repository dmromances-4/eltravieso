import { generateSecret, generateURI, verify } from "otplib";

const ISSUER = "El Travieso";

export function createTwoFactorSecret() {
  return generateSecret();
}

export function buildTwoFactorOtpAuthUri(email: string, secret: string) {
  return generateURI({
    issuer: ISSUER,
    label: email,
    secret,
    strategy: "totp",
  });
}

export async function verifyTwoFactorToken(secret: string, token: string): Promise<boolean> {
  const normalized = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;

  const result = await verify({
    secret,
    token: normalized,
    strategy: "totp",
    epochTolerance: 1,
  });

  return result.valid;
}
