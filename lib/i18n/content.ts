import type { AppLocale } from "@/i18n/routing";
import { readFileSync, existsSync } from "fs";
import path from "path";

export type LocalizedCocktailFields = {
  glass?: string;
  ingredients?: string[] | string;
  method?: string;
  summary?: string;
  title?: string;
};

type SidecarIndex = Record<string, Record<string, unknown>>;

const sidecarCache = new Map<string, SidecarIndex>();

function cacheKey(locale: AppLocale, source: string) {
  return `${locale}:${source}`;
}

function loadSidecar(source: string, locale: AppLocale): SidecarIndex {
  if (locale === "es") return {};
  const key = cacheKey(locale, source);
  const cached = sidecarCache.get(key);
  if (cached) return cached;

  const filePath = path.join(process.cwd(), "data", "i18n", locale, `${source}.json`);
  if (!existsSync(filePath)) {
    sidecarCache.set(key, {});
    return {};
  }

  const raw = JSON.parse(readFileSync(filePath, "utf8")) as
    | SidecarIndex
    | Array<Record<string, unknown> & { slug: string }>;

  const index: SidecarIndex = Array.isArray(raw)
    ? Object.fromEntries(
        raw
          .filter((item) => typeof item === "object" && item && "slug" in item)
          .map((item) => [item.slug, item]),
      )
    : raw;

  sidecarCache.set(key, index);
  return index;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(base: T, override: Record<string, unknown>): T {
  const result = { ...base } as T;
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const baseVal = result[key as keyof T];
    if (isPlainObject(value) && isPlainObject(baseVal)) {
      result[key as keyof T] = deepMerge(baseVal, value) as T[keyof T];
    } else {
      result[key as keyof T] = value as T[keyof T];
    }
  }
  return result;
}

export function mergeLocalizedFields<T extends { slug: string }>(
  item: T,
  locale: AppLocale,
  source: string,
): T {
  if (locale === "es") return item;
  const sidecar = loadSidecar(source, locale);
  const localized = sidecar[item.slug];
  if (!localized) return item;
  const { slug: _slug, ...fields } = localized;
  return deepMerge(item as Record<string, unknown>, fields) as T;
}

export function getLocalizedCollection<T extends { slug: string }>(
  items: T[],
  locale: AppLocale,
  source: string,
): T[] {
  return items.map((item) => mergeLocalizedFields(item, locale, source));
}
