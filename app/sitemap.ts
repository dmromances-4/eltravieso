import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://eltravieso.com";

const PUBLIC_PATHS = [
  "",
  "/recetas",
  "/shop",
  "/alcoholes",
  "/biblioteca",
  "/blog",
  "/blog/autores",
  "/mapa",
  "/pantalla",
  "/bar-online",
  "/comunidad",
  "/pro/tech-generator",
  "/aviso-legal",
  "/politica-privacidad",
  "/terminos-y-condiciones",
];

function localizedUrl(path: string, locale: string) {
  if (locale === routing.defaultLocale) {
    return `${BASE}${path || "/"}`;
  }
  return `${BASE}/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of PUBLIC_PATHS) {
      const languages: Record<string, string> = {};
      for (const alt of routing.locales) {
        languages[alt] = localizedUrl(path, alt);
      }

      entries.push({
        url: localizedUrl(path, locale),
        lastModified: new Date(),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.7,
        alternates: { languages },
      });
    }
  }

  return entries;
}
