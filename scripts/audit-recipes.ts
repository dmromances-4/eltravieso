#!/usr/bin/env tsx
/**
 * Auditoría de recetas contra Difford's Guide.
 *
 * npm run audit:recipes:backfill
 * npm run audit:recipes -- --limit 5 --dry-run
 * npm run audit:recipes -- --id dg-2887
 * npm run audit:recipes -- --from pending --auto-apply-threshold 95
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
import type { CocktailRecord } from "@/types/cocktail";

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function filterRecipes(recipes: CocktailRecord[]): CocktailRecord[] {
  const id = argValue("--id");
  const from = argValue("--from");
  const limit = Number(argValue("--limit") ?? "0");

  let filtered = recipes;
  if (id) {
    filtered = recipes.filter((r) => r.id === id || r.slug === id);
  } else if (from === "pending") {
    filtered = recipes.filter((r) => (r.reviewStatus ?? "pending") === "pending");
  }

  if (limit > 0) {
    filtered = filtered.slice(0, limit);
  }

  return filtered;
}

async function main() {
  if (hasFlag("--backfill")) {
    const result = await backfillCocktailsFromCsvAsync();
    console.log(`Backfill completado: ${result.updated}/${result.total} recetas actualizadas con id/sourceUrl.`);
    return;
  }

  const dryRun = hasFlag("--dry-run");
  const forceFetch = hasFlag("--force-fetch");
  const autoThreshold = Number(argValue("--auto-apply-threshold") ?? "0");

  let recipes = loadCocktails();
  const targets = filterRecipes(recipes);

  if (!targets.length) {
    console.log("No hay recetas que coincidan con el filtro.");
    return;
  }

  console.log(`Auditando ${targets.length} receta(s)...`);
  const report: AuditReportEntry[] = [];

  for (let i = 0; i < targets.length; i += 1) {
    const recipe = targets[i];
    process.stdout.write(`[${i + 1}/${targets.length}] ${recipe.id} — ${recipe.title} ... `);

    const result = await auditRecipe(recipe, { forceFetch });

    if (result.error || !result.comparison) {
      console.log(`ERROR (${result.error ?? "sin comparación"})`);
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

  if (!dryRun) {
    saveCocktails(recipes);
    console.log("\nGuardado data/cocktails.json (backup automático creado).");
  } else {
    console.log("\nDry-run: no se escribió cocktails.json.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
