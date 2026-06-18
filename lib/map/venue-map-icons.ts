import type { Map as MapLibreMap } from "maplibre-gl";
import { EDITORIAL_COLOR, PREMIUM_COLOR, venueMarkerColor } from "@/components/map/map-constants";

const ICON_IDS = ["pin-editorial", "pin-premium", "pin-affiliate"] as const;
export type VenueMapIconId = (typeof ICON_IDS)[number] | `pin-${string}`;

function pinSvg(fill: string, label: string, labelFill = "#0a0a0a"): string {
  const inner =
    label === "★"
      ? `<text x="14" y="17" text-anchor="middle" font-size="11" font-weight="bold" fill="${labelFill}">★</text>`
      : label === "50"
        ? `<text x="14" y="17" text-anchor="middle" font-size="9" font-weight="bold" fill="${labelFill}">50</text>`
        : `<circle fill="#0a0a0a" cx="14" cy="14" r="5"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path fill="${fill}" stroke="#0a0a0a" stroke-width="1.5" d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z"/>${inner}</svg>`;
}

function svgToImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

export function resolveVenueIconId(
  venueType: string,
  layer: string,
  isPremium?: boolean,
): string {
  if (layer === "editorial") return "pin-editorial";
  if (isPremium) return "pin-premium";
  const colorKey = venueMarkerColor(venueType, layer, isPremium).replace("#", "");
  return `pin-${colorKey}`;
}

export async function registerVenueMapIcons(map: MapLibreMap): Promise<void> {
  const baseIcons: { id: VenueMapIconId; svg: string }[] = [
    { id: "pin-editorial", svg: pinSvg(EDITORIAL_COLOR, "50") },
    { id: "pin-premium", svg: pinSvg(PREMIUM_COLOR, "★", "#F9D142") },
  ];

  for (const { id, svg } of baseIcons) {
    if (map.hasImage(id)) continue;
    const image = await svgToImage(svg);
    map.addImage(id, image, { pixelRatio: 2 });
  }

  const affiliateColors = new Set(
    ["cocteleria", "restaurante", "bar", "bodega"].map((t) =>
      venueMarkerColor(t, "affiliate", false).replace("#", ""),
    ),
  );

  for (const colorKey of affiliateColors) {
    const id = `pin-${colorKey}`;
    if (map.hasImage(id)) continue;
    const fill = `#${colorKey}`;
    const image = await svgToImage(pinSvg(fill, ""));
    map.addImage(id, image, { pixelRatio: 2 });
  }
}
