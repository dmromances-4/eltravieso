import type { RecipeImageInput } from "@/lib/recipes/image-prompt";
import { brandColors } from "@/lib/theme/tokens";

/** SVG placeholder de portada cuando AI_MOCK=true (sin APIs de imagen). */
export function buildBrandedCoverSvg(input: RecipeImageInput): string {
  const title = escapeXml(input.title.slice(0, 48));
  const glass = escapeXml(input.glass.slice(0, 32));
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="#0a0a12"/>
  <rect x="80" y="120" width="920" height="1110" rx="24" fill="${brandColors.blue}" opacity="0.15"/>
  <circle cx="540" cy="520" r="180" fill="none" stroke="${brandColors.yellow}" stroke-width="6"/>
  <text x="540" y="780" text-anchor="middle" fill="#ffffff" font-family="system-ui,sans-serif" font-size="42" font-weight="700">${title}</text>
  <text x="540" y="840" text-anchor="middle" fill="${brandColors.yellow}" font-family="system-ui,sans-serif" font-size="24">${glass}</text>
  <text x="540" y="1240" text-anchor="middle" fill="${brandColors.red}" font-family="system-ui,sans-serif" font-size="18" letter-spacing="4">EL TRAVIESO</text>
</svg>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
