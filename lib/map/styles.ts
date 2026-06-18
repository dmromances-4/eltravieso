export type MapStyleKind = "streets" | "satellite";

const DEFAULT_STREETS =
  process.env.NEXT_PUBLIC_MAPLIBRE_STYLE_URL ??
  "https://tiles.openfreemap.org/styles/liberty";

export function getMapStyleUrl(kind: MapStyleKind): string | null {
  if (kind === "satellite") {
    const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
    if (!key) return null;
    return `https://api.maptiler.com/maps/hybrid/style.json?key=${key}`;
  }
  return DEFAULT_STREETS;
}

export function satelliteStyleAvailable(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_MAPTILER_API_KEY);
}

export function getTerrainUrl(): string | null {
  const custom = process.env.NEXT_PUBLIC_MAP_TERRAIN_URL?.trim();
  if (custom) return custom;
  const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  if (!key) return null;
  return `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${key}`;
}
