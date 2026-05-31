export type IngredientItem = { name: string; amount: string };

export function parseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  const candidate = start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;

  try {
    return JSON.parse(candidate) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function parseIngredientList(value: unknown): IngredientItem[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          const parts = item.split(/\s+-\s+|:\s+/).map((part) => part.trim()).filter(Boolean);
          return {
            name: parts[1] ?? parts[0],
            amount: parts[1] ? parts[0] : "—",
          };
        }

        if (typeof item === "object" && item !== null) {
          const row = item as Record<string, unknown>;
          return {
            name: String(row.name ?? row.label ?? row.ingredient ?? row.product ?? "Ingrediente").trim(),
            amount: String(row.amount ?? row.quantity ?? row.value ?? "—").trim(),
          };
        }

        return { name: String(item), amount: "—" };
      })
      .filter((ingredient) => ingredient.name && ingredient.name !== "Ingrediente");
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value as Record<string, unknown>).map(([key, val]) => ({
      name: String(key).trim(),
      amount: String(
        typeof val === "object" && val !== null
          ? (val as Record<string, unknown>).amount ?? (val as Record<string, unknown>).quantity ?? val
          : val ?? "—",
      ).trim(),
    }));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "[]") return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) || (typeof parsed === "object" && parsed !== null)) {
        return parseIngredientList(parsed);
      }
    } catch {
      // plain text list
    }

    return trimmed
      .split(/\r?\n|,|;|\|\|/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/\s+-\s+|:\s+/).map((part) => part.trim()).filter(Boolean);
        return {
          name: parts[1] ?? parts[0],
          amount: parts[1] ? parts[0] : "—",
        };
      });
  }

  return [];
}

export function ingredientsToStrings(items: IngredientItem[]): string[] {
  return items.map((item) => {
    const amount = item.amount && item.amount !== "—" ? item.amount : "";
    return amount ? `${amount} ${item.name}`.trim() : item.name;
  });
}

export function parseStoredIngredients(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  const asList = parseIngredientList(raw);
  if (asList.length > 0) return ingredientsToStrings(asList);
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
