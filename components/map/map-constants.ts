import { brandColors } from "@/lib/theme/tokens";

export const VENUE_TYPE_COLORS: Record<string, string> = {
  cocteleria: brandColors.yellow,
  restaurante: brandColors.blue,
  bar: brandColors.red,
  bodega: "#9B59B6",
};

export const EDITORIAL_COLOR = brandColors.yellow;
export const PREMIUM_COLOR = brandColors.red;

export function venueMarkerColor(venueType: string, layer: string, isPremium?: boolean): string {
  if (layer === "editorial") return EDITORIAL_COLOR;
  if (isPremium) return PREMIUM_COLOR;
  return VENUE_TYPE_COLORS[venueType] ?? VENUE_TYPE_COLORS.bar;
}
