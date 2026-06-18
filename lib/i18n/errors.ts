import type { AppLocale } from "@/i18n/routing";

export type ApiErrorKey = keyof typeof ERROR_KEYS;

const ERROR_KEYS = {
  unauthorized: "errors.unauthorized",
  forbidden: "errors.forbidden",
  notFound: "errors.notFound",
  validation: "errors.validation",
  server: "errors.server",
  rateLimit: "errors.rateLimit",
  loginRequired: "errors.loginRequired",
  recipeNotFound: "errors.recipeNotFound",
  productNotFound: "errors.productNotFound",
  invalidCredentials: "errors.invalidCredentials",
  emailTaken: "errors.emailTaken",
  weakPassword: "errors.weakPassword",
  cartEmpty: "errors.cartEmpty",
  paymentFailed: "errors.paymentFailed",
  passwordMismatch: "errors.passwordMismatch",
  invalidEmail: "errors.invalidEmail",
  paymentsDisabled: "errors.paymentsDisabled",
  marketplaceLoginRequired: "errors.marketplaceLoginRequired",
  invalidBody: "errors.invalidBody",
} as const;

type Messages = {
  errors: Record<string, string>;
};

const messageCache = new Map<AppLocale, Messages>();

async function loadMessages(locale: AppLocale): Promise<Messages> {
  const cached = messageCache.get(locale);
  if (cached) return cached;
  const messages = (await import(`@/messages/${locale}.json`)).default as Messages;
  messageCache.set(locale, messages);
  return messages;
}

function getNested(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export async function getApiMessage(
  locale: AppLocale,
  key: ApiErrorKey,
): Promise<string> {
  const messages = await loadMessages(locale);
  const path = ERROR_KEYS[key];
  return getNested(messages, path) ?? key;
}

export function getApiMessageSync(
  messages: Messages,
  key: ApiErrorKey,
): string {
  const path = ERROR_KEYS[key];
  return getNested(messages, path) ?? key;
}

export { ERROR_KEYS };
