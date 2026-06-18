import { routing, type AppLocale } from "@/i18n/routing";

const LOCALE_COOKIE = "NEXT_LOCALE";

export function isAppLocale(value: string): value is AppLocale {
  return routing.locales.includes(value as AppLocale);
}

export function resolveLocale(
  value: string | null | undefined,
  fallback: AppLocale = routing.defaultLocale,
): AppLocale {
  if (value && isAppLocale(value)) return value;
  return fallback;
}

export function localeFromAcceptLanguage(header: string | null): AppLocale {
  if (!header) return routing.defaultLocale;
  const preferred = header
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase())
    .find(Boolean);
  if (preferred?.startsWith("en")) return "en";
  return routing.defaultLocale;
}

export function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || "/";
    }
  }
  return pathname;
}

export function withLocalePrefix(pathname: string, locale: AppLocale): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === routing.defaultLocale) return normalized;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}

export { LOCALE_COOKIE };
