import { brandColors, surfaceColors } from "../../lib/theme/tokens";

export const BRAND = {
  blue: brandColors.blue,
  yellow: brandColors.yellow,
  red: brandColors.red,
  dark: surfaceColors.night,
  panel: surfaceColors.panel,
} as const;

export function resolveAssetUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return url.startsWith("/") ? url.slice(1) : url;
}
