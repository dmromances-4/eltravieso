import fs from "fs";
import path from "path";
import type { CocktailRecord } from "@/types/cocktail";
import type { AppLocale } from "@/i18n/routing";
import { getLocalizedCollection, mergeLocalizedFields } from "@/lib/i18n/content";

export const COCKTAILS_PATH = path.join(process.cwd(), "data", "cocktails.json");
export const AUDIT_REPORT_PATH = path.join(process.cwd(), "data", "cocktails-audit-report.json");

export function backupCocktailsJson(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(process.cwd(), "data", `cocktails.json.bak-${timestamp}`);
  if (fs.existsSync(COCKTAILS_PATH)) {
    fs.copyFileSync(COCKTAILS_PATH, backupPath);
  }
  return backupPath;
}

export function loadCocktails(locale: AppLocale = "es"): CocktailRecord[] {
  if (!fs.existsSync(COCKTAILS_PATH)) {
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(COCKTAILS_PATH, "utf8")) as CocktailRecord[];
  const normalized = raw.map(normalizeLegacyRecord);
  return getLocalizedCollection(normalized, locale, "cocktails");
}

export function getCocktailBySlug(slug: string, locale: AppLocale = "es"): CocktailRecord | undefined {
  const recipes = loadCocktails(locale);
  return recipes.find((r) => r.slug === slug);
}

export function localizeCocktail(recipe: CocktailRecord, locale: AppLocale): CocktailRecord {
  return mergeLocalizedFields(recipe, locale, "cocktails");
}

export function saveCocktails(recipes: CocktailRecord[], options?: { skipBackup?: boolean }) {
  if (!options?.skipBackup) {
    backupCocktailsJson();
  }
  fs.writeFileSync(COCKTAILS_PATH, `${JSON.stringify(recipes, null, 2)}\n`, "utf8");
}

export function getRecipeById(recipes: CocktailRecord[], id: string): CocktailRecord | undefined {
  return recipes.find((r) => r.id === id || r.slug === id);
}

export function updateRecipeById(
  recipes: CocktailRecord[],
  id: string,
  patch: Partial<CocktailRecord>,
): CocktailRecord[] {
  return recipes.map((recipe) => {
    if (recipe.id !== id && recipe.slug !== id) return recipe;
    return { ...recipe, ...patch, id: recipe.id || patch.id || id };
  });
}

export function normalizeLegacyRecord(recipe: CocktailRecord): CocktailRecord {
  const slug = recipe.slug || recipe.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const id = recipe.id || (recipe.diffordsId ? `dg-${recipe.diffordsId}` : `slug-${slug}`);
  return {
    ...recipe,
    id,
    slug,
    reviewStatus: recipe.reviewStatus ?? "pending",
  };
}

export type AuditReportEntry = {
  id: string;
  title: string;
  score: number;
  issues: string[];
  action: "none" | "applied_diffords" | "marked_ok" | "marked_manual" | "skipped";
  at: string;
};

export function appendAuditReport(entries: AuditReportEntry[]) {
  let existing: AuditReportEntry[] = [];
  if (fs.existsSync(AUDIT_REPORT_PATH)) {
    try {
      existing = JSON.parse(fs.readFileSync(AUDIT_REPORT_PATH, "utf8")) as AuditReportEntry[];
    } catch {
      existing = [];
    }
  }
  const merged = [...existing, ...entries];
  fs.writeFileSync(AUDIT_REPORT_PATH, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
}
