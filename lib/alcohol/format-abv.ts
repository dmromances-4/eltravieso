export function formatAbv(abv: number | string | null | undefined): string | null {
  if (abv == null || abv === "" || abv === "—") return null;
  if (typeof abv === "number" && Number.isFinite(abv)) return `${abv}% ABV`;
  const raw = String(abv).trim();
  if (!/\d/.test(raw)) return null;
  const numeric = Number(raw.replace(",", ".").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(numeric)) return null;
  return `${numeric}% ABV`;
}

export function isPlaceholderValue(value: string | null | undefined): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  return trimmed === "—" || trimmed === "-" || trimmed === "Pendiente de validación";
}
