export const RECIPE_COVER_PLACEHOLDER = "/cocktail-placeholder.svg";

/** True for real photo covers (jpg/png/webp or remote URL). SVG and placeholders are not photos. */
export function isPhotoCover(cover?: string | null): boolean {
  if (!cover || cover === RECIPE_COVER_PLACEHOLDER || cover.includes("placeholder")) return false;
  if (cover.endsWith(".svg")) return false;
  return /\.(jpe?g|webp|png)(\?|$)/i.test(cover) || cover.startsWith("http");
}

export function shouldRegenerateCover(cover?: string | null, force = false): boolean {
  if (force) return true;
  return !isPhotoCover(cover);
}
