import { maskSecret } from "./redact";

type BarProfileWithSecrets = {
  tpvToken?: string | null;
  holdedWebhookToken?: string | null;
  shopifyApiKey?: string | null;
  shopifyAccessToken?: string | null;
  holdedApiKey?: string | null;
  squareAccessToken?: string | null;
  [key: string]: unknown;
};

/** Respuesta segura de perfil de bar: nunca expone tokens en claro. */
export function sanitizeBarProfileForClient<T extends BarProfileWithSecrets>(profile: T) {
  const {
    tpvToken,
    holdedWebhookToken,
    shopifyApiKey,
    shopifyAccessToken,
    holdedApiKey,
    squareAccessToken,
    ...rest
  } = profile;

  return {
    ...rest,
    hasTpvToken: Boolean(tpvToken),
    tpvTokenPreview: maskSecret(tpvToken),
    hasHoldedWebhookToken: Boolean(holdedWebhookToken),
    holdedWebhookTokenPreview: maskSecret(holdedWebhookToken),
    hasShopifyCredentials: Boolean(shopifyApiKey || shopifyAccessToken),
    hasHoldedApiKey: Boolean(holdedApiKey),
    hasSquareAccessToken: Boolean(squareAccessToken),
  };
}
