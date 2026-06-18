#!/usr/bin/env tsx
/**
 * Auditoría de recetas contra Difford's Guide.
 */

import { backfillCocktailsFromCsvAsync } from "@/lib/recipes/cocktail-backfill";
import {
  appendAuditReport,
  loadCocktails,
  saveCocktails,
  updateRecipeById,
  type AuditReportEntry,
} from "@/lib/recipes/cocktails-io";
import { auditRecipe, applyDiffordsToRecipe, markRecipeReviewed } from "@/lib/recipes/audit-recipe";
import type { SyncPhaseResult } from "@/lib/catalog/sync-report";
import type { CocktailRecord } from "@/types/cocktail";
import { pathToFileURL } from "url";

export type AuditRecipesOptions = {
  id?: string;
  from?: "pending" | string;
  limit?: number;
  dryRun?: boolean;
  forceFetch?: boolean;
  autoApplyThreshold?: number;
  backfill?: boolean;
};

function filterRecipes(recipes: CocktailRecord[], options: AuditRecipesOptions): CocktailRecord[] {
  let filtered = recipes;
  if (options.id) {
    filtered = recipes.filter((r) => r.id === options.id || r.slug === options.id);
  } else if (options.from === "pending") {
    filtered = recipes.filter((r) => (r.reviewStatus ?? "pending") === "pending");
  }

  if (options.limit && options.limit > 0) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

function parseCliOptions(): AuditRecipesOptions {
  function argValue(flag: string): string | undefined {
    const idx = process.argv.indexOf(flag);
    if (idx === -1) return undefined;
    return process.argv[idx + 1];
  }

  return {
    id: argValue("--id"),
    from: argValue("--from"),
    limit: Number(argValue("--limit") ?? "0") || undefined,
    dryRun: process.argv.includes("--dry-run"),
    forceFetch: process.argv.includes("--force-fetch"),
    autoApplyThreshold: Number(argValue("--auto-apply-threshold") ?? "0") || undefined,
    backfill: process.argv.includes("--backfill"),
  };
}

export async function runAuditRecipes(options: AuditRecipesOptions = {}): Promise<SyncPhaseResult> {
  if (options.backfill) {
    const result = await backfillCocktailsFromCsvAsync();
    console.log(`Backfill completado: ${result.updated}/${result.total} recetas actualizadas con id/sourceUrl.`);
    return {
      added: result.updated,
      skipped: result.total - result.updated,
      total: result.total,
      errors: 0,
    };
  }

  const dryRun = options.dryRun ?? false;
  const autoThreshold = options.autoApplyThreshold ?? 0;

  let recipes = loadCocktails();
  const targets = filterRecipes(recipes, options);

  if (!targets.length) {
    console.log("No hay recetas que coincidan con el filtro.");
    return { added: 0, skipped: 0, total: recipes.length, errors: 0 };
  }

  console.log(`Auditando ${targets.length} receta(s)...`);
  const report: AuditReportEntry[] = [];
  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < targets.length; i += 1) {
    const recipe = targets[i];
    process.stdout.write(`[${i + 1}/${targets.length}] ${recipe.id} — ${recipe.title} ... `);

    const result = await auditRecipe(recipe, { forceFetch: options.forceFetch });

    if (result.error || !result.comparison) {
      console.log(`ERROR (${result.error ?? "sin comparación"})`);
      errors += 1;
      report.push({
        id: recipe.id,
        title: recipe.title,
        score: 0,
        issues: [],
        action: "skipped",
        at: new Date().toISOString(),
      });
      continue;
    }

    const { score, issues } = result.comparison;
    console.log(`score ${score} (${issues.join(", ") || "ok"})`);

    let action: AuditReportEntry["action"] = "none";
    let updatedRecipe = recipe;

    if (autoThreshold > 0 && score < autoThreshold && result.diffordsRaw) {
      updatedRecipe = applyDiffordsToRecipe(recipe, result.diffordsRaw, "Auto-aplicado por CLI");
      action = "applied_diffords";
    } else if (score >= 95 && (recipe.reviewStatus ?? "pending") === "pending") {
      updatedRecipe = markRecipeReviewed(recipe, "ok", "Marcada ok por score alto");
      action = "marked_ok";
    }

    if (!dryRun && action !== "none") {
      recipes = updateRecipeById(recipes, recipe.id, updatedRecipe);
      added += 1;
    } else if (action === "none") {
      skipped += 1;
    }

    report.push({
      id: recipe.id,
      title: recipe.title,
      score,
      issues,
      action,
      at: new Date().toISOString(),
    });
  }

  appendAuditReport(report);

  if (!dryRun && added > 0) {
    saveCocktails(recipes);
    console.log("\nGuardado data/cocktails.json (backup automático creado).");
  } else if (dryRun) {
    console.log("\nDry-run: no se escribió cocktails.json.");
  }

  return { added, skipped, total: recipes.length, errors };
}

async function main() {
  await runAuditRecipes(parseCliOptions());
}

const isDirectRun = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
