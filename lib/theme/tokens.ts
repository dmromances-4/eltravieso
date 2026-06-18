/** Official El Travieso brand palette — single source of truth. */
export const brandColors = {
  yellow: "#F9D142",
  blue: "#2B87B9",
  red: "#A62125",
} as const;

/** Legacy dark surfaces (admin / venues brutalist). */
export const surfaceColors = {
  night: "#0F0F0F",
  charcoal: "#141414",
  panel: "#111111",
  strong: "#090909",
  steel: "#272727",
  smoke: "#B7B7B7",
} as const;

/** Public shell — light editorial theme. */
export const lightSurfaces = {
  page: "#FAFAFA",
  panel: "#FFFFFF",
  muted: "#F4F4F5",
  border: "#E2E8F0",
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
  card: "0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.08)",
  subtle: "0 4px 24px rgba(15, 23, 42, 0.08)",
} as const;

export type BrandColorKey = keyof typeof brandColors;
