import { defineRouting } from "next-intl/routing";

export const locales = ["es", "en"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "es";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeCookie: {
    name: "NEXT_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
  },
});
