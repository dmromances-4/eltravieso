import type { RecipeImageInput } from "@/lib/recipes/image-prompt";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstIngredients(input: RecipeImageInput): string {
  const ingredients = input.ingredients
    .map((ingredient) => ingredient.trim())
    .filter(Boolean)
    .slice(0, 3);

  return ingredients.length > 0 ? ingredients.join(" / ") : input.glass || "Cocktail";
}

export function buildBrandedCoverSvg(input: RecipeImageInput): string {
  const title = escapeXml(input.title || "El Travieso");
  const subtitle = escapeXml(firstIngredients(input));
  const glass = escapeXml(input.glass || "Receta de cocteleria");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050510"/>
      <stop offset="48%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#2B0A12"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="52%">
      <stop offset="0%" stop-color="#F9D142" stop-opacity="0.6"/>
      <stop offset="40%" stop-color="#2B87B9" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#050510" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000000" flood-opacity="0.55"/>
    </filter>
  </defs>
  <rect width="1200" height="1500" fill="url(#bg)"/>
  <rect width="1200" height="1500" fill="url(#glow)"/>
  <circle cx="190" cy="210" r="110" fill="#A62125" opacity="0.32"/>
  <circle cx="1020" cy="320" r="170" fill="#2B87B9" opacity="0.28"/>
  <circle cx="980" cy="1180" r="230" fill="#F9D142" opacity="0.16"/>

  <g filter="url(#shadow)">
    <path d="M430 430h340l-48 545c-8 88-82 155-171 155s-163-67-171-155L430 430Z" fill="#101827" stroke="#F9D142" stroke-width="12"/>
    <path d="M472 530h256l-34 392c-7 64-60 112-124 112s-117-48-124-112L472 530Z" fill="#A62125" opacity="0.88"/>
    <path d="M505 565c82 50 151 46 206 4l-15 176c-58 38-126 42-207-2l16-178Z" fill="#F9D142" opacity="0.42"/>
    <ellipse cx="600" cy="430" rx="190" ry="34" fill="#050510" stroke="#2B87B9" stroke-width="10"/>
    <path d="M600 1132v150" stroke="#F9D142" stroke-width="18" stroke-linecap="round"/>
    <path d="M475 1300h250" stroke="#F9D142" stroke-width="22" stroke-linecap="round"/>
  </g>

  <text x="96" y="118" fill="#F9D142" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="10">EL TRAVIESO</text>
  <text x="96" y="1228" fill="#ffffff" font-family="Georgia, serif" font-size="86" font-weight="700">${title}</text>
  <text x="100" y="1302" fill="#9CC8DF" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="600">${glass}</text>
  <text x="100" y="1362" fill="#E6E9EF" font-family="Inter, Arial, sans-serif" font-size="30">${subtitle}</text>
  <rect x="96" y="1408" width="360" height="10" fill="#A62125"/>
</svg>`;
}
