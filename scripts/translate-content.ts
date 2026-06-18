#!/usr/bin/env tsx
/**
 * Batch-translate static catalog content into locale sidecars.
 *
 *   npm run translate:content -- --locale en --source cocktails --limit 10
 *   npm run translate:content -- --locale en --source books --slug the-savoy-cocktail-book --dry-run
 *   npm run translate:content -- --locale en --source alcohol-encyclopedia --limit 5
 *   npm run translate:content -- --locale en --source venues --limit 10
 */

import fs from "fs";
import path from "path";
import booksData from "@/data/books.json";
import alcoholData from "@/data/alcohol-encyclopedia.json";
import venuesData from "@/data/venues-worlds50best.json";
import { loadCocktails } from "@/lib/recipes/cocktails-io";
import type { BookRecord } from "@/types/book";
import type { AlcoholRecord } from "@/types/alcohol";
import type { AppLocale } from "@/i18n/routing";

const RATE_MS = Number(process.env.TRANSLATE_RATE_MS ?? 2000);

type Source = "cocktails" | "alcohol-encyclopedia" | "books" | "venues";

type VenueSeedRecord = {
  slug: string;
  name: string;
  history: string | null;
  verdict: string | null;
};

type Options = {
  locale: AppLocale;
  source: Source;
  limit: number;
  slug?: string;
  dryRun: boolean;
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx >= 0 ? args[idx + 1] : undefined;
  };

  const locale = (get("--locale") ?? "en") as AppLocale;
  const source = (get("--source") ?? "cocktails") as Source;
  const limit = Number(get("--limit") ?? "25");
  const slug = get("--slug");
  const dryRun = args.includes("--dry-run");

  return { locale, source, limit, slug, dryRun };
}

function sidecarPath(locale: AppLocale, source: Source) {
  return path.join(process.cwd(), "data", "i18n", locale, `${source}.json`);
}

function loadSidecar(locale: AppLocale, source: Source): Record<string, Record<string, unknown>> {
  const file = sidecarPath(locale, source);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, Record<string, unknown>>;
}

function saveSidecar(locale: AppLocale, source: Source, data: Record<string, unknown>) {
  const file = sidecarPath(locale, source);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function targetLanguage(locale: AppLocale) {
  return locale === "en" ? "English" : "Spanish";
}

async function translateJsonWithAi(
  prompt: string,
  targetLocale: AppLocale,
): Promise<Record<string, unknown>> {
  const { generateText } = await import("@/lib/ai/provider");
  const raw = await generateText(prompt, { maxTokens: 2000, locale: targetLocale });
  const match = raw.text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI did not return JSON");
  return JSON.parse(match[0]) as Record<string, unknown>;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateCocktails(options: Options) {
  const cocktails = loadCocktails("es");
  const sidecar = loadSidecar(options.locale, "cocktails");
  const targets = cocktails
    .filter((item) => (options.slug ? item.slug === options.slug : !sidecar[item.slug]))
    .slice(0, options.limit);

  console.log(`Translating ${targets.length} cocktails → ${options.locale}`);

  for (const item of targets) {
    console.log(`• ${item.slug}`);
    if (options.dryRun) continue;

    try {
      const prompt = `Translate this cocktail recipe content to ${targetLanguage(options.locale)}.
Keep brand names (El Travieso, Hayman's, etc.) unchanged.
Return ONLY valid JSON with keys: glass, ingredients (array of strings), method (string).
Recipe title: ${item.title}
Glass: ${item.glass}
Ingredients: ${JSON.stringify(item.ingredients)}
Method: ${item.method}`;

      const translated = await translateJsonWithAi(prompt, options.locale);
      sidecar[item.slug] = translated;
      saveSidecar(options.locale, "cocktails", sidecar);
      await sleep(RATE_MS);
    } catch (error) {
      console.error(`  failed: ${item.slug}`, error);
    }
  }

  console.log("Done.");
}

async function translateBooks(options: Options) {
  const books = booksData as BookRecord[];
  const sidecar = loadSidecar(options.locale, "books");
  const targets = books
    .filter((item) => (options.slug ? item.slug === options.slug : !sidecar[item.slug]))
    .slice(0, options.limit);

  console.log(`Translating ${targets.length} books → ${options.locale}`);

  for (const item of targets) {
    console.log(`• ${item.slug}`);
    if (options.dryRun) continue;

    try {
      const prompt = `Translate this book catalog entry to ${targetLanguage(options.locale)}.
Keep author names, publisher names and ISBN unchanged.
Return ONLY valid JSON with keys: title, subtitle (or null), summary, whyItMatters (or null), tags (array of strings).
Source:
${JSON.stringify({
  title: item.title,
  subtitle: item.subtitle ?? null,
  summary: item.summary,
  whyItMatters: item.whyItMatters ?? null,
  tags: item.tags ?? [],
})}`;

      const translated = await translateJsonWithAi(prompt, options.locale);
      sidecar[item.slug] = translated;
      saveSidecar(options.locale, "books", sidecar);
      await sleep(RATE_MS);
    } catch (error) {
      console.error(`  failed: ${item.slug}`, error);
    }
  }

  console.log("Done.");
}

async function translateAlcohol(options: Options) {
  const alcohols = alcoholData as AlcoholRecord[];
  const sidecar = loadSidecar(options.locale, "alcohol-encyclopedia");
  const targets = alcohols
    .filter((item) => (options.slug ? item.slug === options.slug : !sidecar[item.slug]))
    .slice(0, options.limit);

  console.log(`Translating ${targets.length} alcohol entries → ${options.locale}`);

  for (const item of targets) {
    console.log(`• ${item.slug}`);
    if (options.dryRun) continue;

    try {
      const prompt = `Translate this spirits encyclopedia entry to ${targetLanguage(options.locale)}.
Keep brand names, producer names and proper nouns unchanged.
Return ONLY valid JSON with the same nested structure, translating text fields only:
category, subcategory, producer_type, denomination_of_origin,
identity (country, region, sub_region only — not brand/producer/name_exact),
technical (raw_material, fermentation_type, distillation_method),
chronology (vintage, maturation_time, barrel_type),
sensory (sight, nose, palate),
market (production_status, rarity),
didactic (history_context, mixology_role, iconic_cocktails array),
advanced (raw_material, vessel_type, history_context_short).
Source:
${JSON.stringify({
  category: item.category,
  subcategory: item.subcategory,
  producer_type: item.producer_type,
  denomination_of_origin: item.denomination_of_origin,
  identity: {
    country: item.identity.country,
    region: item.identity.region,
    sub_region: item.identity.sub_region,
  },
  technical: item.technical,
  chronology: item.chronology,
  sensory: item.sensory,
  market: { production_status: item.market.production_status, rarity: item.market.rarity },
  didactic: item.didactic,
  advanced: {
    raw_material: item.advanced.raw_material,
    vessel_type: item.advanced.vessel_type,
    history_context_short: item.advanced.history_context_short,
  },
})}`;

      const translated = await translateJsonWithAi(prompt, options.locale);
      sidecar[item.slug] = translated;
      saveSidecar(options.locale, "alcohol-encyclopedia", sidecar);
      await sleep(RATE_MS);
    } catch (error) {
      console.error(`  failed: ${item.slug}`, error);
    }
  }

  console.log("Done.");
}

async function translateVenues(options: Options) {
  const venues = venuesData as VenueSeedRecord[];
  const sidecar = loadSidecar(options.locale, "venues");
  const targets = venues
    .filter((item) => {
      if (options.slug) return item.slug === options.slug;
      if (sidecar[item.slug]) return false;
      return Boolean(item.history || item.verdict);
    })
    .slice(0, options.limit);

  console.log(`Translating ${targets.length} venues → ${options.locale}`);

  for (const item of targets) {
    console.log(`• ${item.slug}`);
    if (options.dryRun) continue;

    try {
      const prompt = `Translate this venue guide text to ${targetLanguage(options.locale)}.
Keep venue name "${item.name}" unchanged.
Return ONLY valid JSON with keys: history (string or null), verdict (string or null).
Source:
${JSON.stringify({ history: item.history, verdict: item.verdict })}`;

      const translated = await translateJsonWithAi(prompt, options.locale);
      sidecar[item.slug] = translated;
      saveSidecar(options.locale, "venues", sidecar);
      await sleep(RATE_MS);
    } catch (error) {
      console.error(`  failed: ${item.slug}`, error);
    }
  }

  console.log("Done.");
}

async function main() {
  const options = parseArgs();
  if (options.locale === "es") {
    console.error("Target locale must not be es (source catalog is Spanish).");
    process.exit(1);
  }

  switch (options.source) {
    case "cocktails":
      await translateCocktails(options);
      break;
    case "books":
      await translateBooks(options);
      break;
    case "alcohol-encyclopedia":
      await translateAlcohol(options);
      break;
    case "venues":
      await translateVenues(options);
      break;
    default:
      console.error(`Unknown source: ${options.source}`);
      process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
