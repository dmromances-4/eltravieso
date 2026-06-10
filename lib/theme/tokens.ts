/** Official El Travieso brand palette — single source of truth. */
export const brandColors = {
  yellow: "#F9D142",
  blue: "#2B87B9",
  red: "#A62125",
} as const;

export const surfaceColors = {
  night: "#0F0F0F",
  charcoal: "#141414",
  panel: "#111111",
  strong: "#090909",
  steel: "#272727",
  smoke: "#B7B7B7",
} as const;

export const brandRadii = {
  card: "1rem",
  pill: "9999px",
} as const;

export const brandTypography = {
  display: "var(--font-display)",
  body: "var(--font-sans)",
} as const;

export const brandShadows = {
  card: "0 1px 0 rgba(255,255,255,0.04), 0 24px 48px rgba(0,0,0,0.35)",
  subtle: "0 8px 32px rgba(0,0,0,0.25)",
} as const;

export type BrandColorKey = keyof typeof brandColors;
