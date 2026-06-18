import { headers, cookies } from "next/headers";
import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { localeFromAcceptLanguage, resolveLocale, LOCALE_COOKIE } from "@/lib/i18n/locale";

export function getRequestLocale(): AppLocale {
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (cookieLocale) return resolveLocale(cookieLocale);

  const headerStore = headers();
  return localeFromAcceptLanguage(headerStore.get("accept-language"));
}

export function getRequestLocaleFromHeaders(request: Request): AppLocale {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
  if (match?.[1]) return resolveLocale(match[1]);

  return localeFromAcceptLanguage(request.headers.get("accept-language"));
}

export function isSupportedLocale(value: string): value is AppLocale {
  return routing.locales.includes(value as AppLocale);
}
