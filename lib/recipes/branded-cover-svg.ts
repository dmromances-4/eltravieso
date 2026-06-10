import { inferLiquidTone, type RecipeImageInput } from "@/lib/recipes/image-prompt";
import { brandColors } from "@/lib/theme/tokens";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hueFromTitle(title: string) {
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

/** Branded SVG cover for local dev / AI_MOCK when no API image is available. */
export function buildBrandedCoverSvg(input: RecipeImageInput): string {
  const hue = hueFromTitle(input.title);
  const tone = inferLiquidTone(input.ingredients);
  const title = escapeXml(input.title);
  const glass = escapeXml(input.glass || "Copa de autor");
  const subtitle = escapeXml(tone.slice(0, 80));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0A0A0A"/>
      <stop offset="45%" stop-color="#111111"/>
      <stop offset="100%" stop-color="hsl(${hue}, 55%, 18%)"/>
    </linearGradient>
    <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="hsl(${hue}, 70%, 55%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 40) % 360}, 65%, 35%)"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="35%" r="60%">
      <stop offset="0%" stop-color="${brandColors.yellow}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${brandColors.yellow}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#bg)"/>
  <rect width="800" height="1000" fill="url(#glow)"/>
  <circle cx="680" cy="120" r="90" fill="${brandColors.blue}" opacity="0.12"/>
  <circle cx="120" cy="880" r="110" fill="${brandColors.red}" opacity="0.1"/>
  <path d="M280 720 Q400 520 520 720 L480 920 L320 920 Z" fill="url(#liquid)" opacity="0.95"/>
  <ellipse cx="400" cy="720" rx="130" ry="22" fill="${brandColors.yellow}" opacity="0.35"/>
  <rect x="360" y="430" width="80" height="290" rx="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)"/>
  <text x="48" y="96" fill="${brandColors.yellow}" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="6">EL TRAVIESO</text>
  <text x="48" y="860" fill="#FFFFFF" font-family="Georgia, serif" font-size="52" font-weight="700">${title}</text>
  <text x="48" y="910" fill="${brandColors.blue}" font-family="Arial, sans-serif" font-size="22">${glass}</text>
  <text x="48" y="948" fill="#B7B7B7" font-family="Arial, sans-serif" font-size="16">${subtitle}</text>
</svg>`;
}
