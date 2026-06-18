import alcoholData from "@/data/alcohol-encyclopedia.json";
import type { AppLocale } from "@/i18n/routing";
import { getLocalizedCollection, mergeLocalizedFields } from "@/lib/i18n/content";
import type { AlcoholRecord } from "@/types/alcohol";

const alcohols = alcoholData as AlcoholRecord[];

export function getAllAlcohols(locale: AppLocale = "es"): AlcoholRecord[] {
  return getLocalizedCollection(alcohols, locale, "alcohol-encyclopedia");
}

export function getAlcoholBySlug(slug: string, locale: AppLocale = "es"): AlcoholRecord | null {
  const item = alcohols.find((alcohol) => alcohol.slug === slug);
  if (!item) return null;
  return mergeLocalizedFields(item, locale, "alcohol-encyclopedia");
}
