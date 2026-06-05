import type { CocktailRecord, RecipeReviewStatus } from "@/types/cocktail";

export type ExportFormat = "json" | "csv" | "notion";

export type CocktailFichaExport = {
  id: string;
  title: string;
  slug: string;
  glass: string;
  ingredients: string[];
  methodSteps: string[];
  method: string;
  abv: string;
  kcal: number;
  rating: number;
  cover: string;
  reviewStatus: RecipeReviewStatus;
  sourceUrl?: string;
  webUrl: string;
  reviewedAt?: string;
};

const REVIEWED: RecipeReviewStatus[] = ["ok", "fixed"];

export function filterForExport(
  recipes: CocktailRecord[],
  options?: { all?: boolean; limit?: number },
): CocktailRecord[] {
  let filtered = options?.all
    ? recipes
    : recipes.filter((r) => REVIEWED.includes(r.reviewStatus ?? "pending"));

  const limit = options?.limit ?? 0;
  if (limit > 0) {
    filtered = filtered.slice(0, limit);
  }
  return filtered;
}

export function toFichaExport(recipe: CocktailRecord, baseUrl: string): CocktailFichaExport {
  const base = baseUrl.replace(/\/$/, "");
  return {
    id: recipe.id,
    title: recipe.title,
    slug: recipe.slug,
    glass: recipe.glass,
    ingredients: recipe.ingredients,
    methodSteps: recipe.method.split("\n").map((s) => s.trim()).filter(Boolean),
    method: recipe.method,
    abv: recipe.abv,
    kcal: recipe.kcal,
    rating: recipe.rating,
    cover: recipe.cover,
    reviewStatus: recipe.reviewStatus ?? "pending",
    sourceUrl: recipe.sourceUrl,
    webUrl: `${base}/recetas/${recipe.slug}`,
    reviewedAt: recipe.reviewedAt,
  };
}

function escapeCsv(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(rows: CocktailFichaExport[]): string {
  const headers = [
    "id",
    "title",
    "slug",
    "glass",
    "abv",
    "kcal",
    "rating",
    "reviewStatus",
    "webUrl",
    "sourceUrl",
    "ingredients",
    "method",
  ];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.title,
        row.slug,
        row.glass,
        row.abv,
        String(row.kcal),
        String(row.rating),
        row.reviewStatus,
        row.webUrl,
        row.sourceUrl ?? "",
        row.ingredients.join(" | "),
        row.method.replace(/\n/g, " "),
      ]
        .map(escapeCsv)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

export type NotionExportRow = CocktailFichaExport & {
  notionProperties: {
    Nombre: string;
    Slug: string;
    Vaso: string;
    ABV: string;
    Kcal: number;
    Rating: number;
    "Estado revisión": string;
    "URL web": string;
    "Difford's": string;
    Ingredientes: string;
    Preparación: string;
  };
};

const NUMBERED_STEP = /^\d+\.\s*/;

function formatPreparationStep(step: string, index: number): string {
  return NUMBERED_STEP.test(step) ? step : `${index + 1}. ${step}`;
}

export function toNotionExport(rows: CocktailFichaExport[]): NotionExportRow[] {
  return rows.map((row) => ({
    ...row,
    notionProperties: {
      Nombre: row.title,
      Slug: row.slug,
      Vaso: row.glass,
      ABV: row.abv,
      Kcal: row.kcal,
      Rating: row.rating,
      "Estado revisión": row.reviewStatus,
      "URL web": row.webUrl,
      "Difford's": row.sourceUrl ?? "",
      Ingredientes: row.ingredients.join("\n"),
      Preparación: row.methodSteps
        .map((s, i) => formatPreparationStep(s, i))
        .join("\n"),
    },
  }));
}

export function parseExportArgs(argv: string[]) {
  const argValue = (flag: string) => {
    const idx = argv.indexOf(flag);
    if (idx === -1) return undefined;
    return argv[idx + 1];
  };
  const all = argv.includes("--all");
  const limitRaw = argValue("--limit");
  const limit = limitRaw ? Number(limitRaw) : 0;
  const format = (argValue("--format") ?? "json") as ExportFormat;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return { all, limit, format, baseUrl };
}

export function buildExportPayload(
  recipes: CocktailRecord[],
  options: ReturnType<typeof parseExportArgs>,
) {
  if (!["json", "csv", "notion"].includes(options.format)) {
    throw new Error(`Formato no soportado: ${options.format}. Usa json, csv o notion.`);
  }

  const filtered = filterForExport(recipes, {
    all: options.all,
    limit: options.limit > 0 ? options.limit : undefined,
  });
  const rows = filtered.map((r) => toFichaExport(r, options.baseUrl));

  if (options.format === "csv") {
    return { rows, content: toCsv(rows), extension: "csv" as const };
  }
  if (options.format === "notion") {
    return {
      rows,
      content: `${JSON.stringify(toNotionExport(rows), null, 2)}\n`,
      extension: "json" as const,
    };
  }
  return { rows, content: `${JSON.stringify(rows, null, 2)}\n`, extension: "json" as const };
}
