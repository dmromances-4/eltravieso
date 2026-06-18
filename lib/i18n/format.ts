import type { AppLocale } from "@/i18n/routing";

const INTL_LOCALE: Record<AppLocale, string> = {
  es: "es-ES",
  en: "en-GB",
};

export function getIntlLocale(locale: AppLocale): string {
  return INTL_LOCALE[locale] ?? INTL_LOCALE.es;
}

export function formatDate(
  value: Date | string | number,
  locale: AppLocale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString(getIntlLocale(locale), options);
}

export function formatDateTime(
  value: Date | string | number,
  locale: AppLocale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString(getIntlLocale(locale), options);
}

export function formatCurrency(
  cents: number,
  locale: AppLocale,
  currency = "EUR",
): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function formatNumber(
  value: number,
  locale: AppLocale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(getIntlLocale(locale), options).format(value);
}
