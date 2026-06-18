"use client";

import type { MapStyleKind } from "@/lib/map/styles";
import { satelliteStyleAvailable } from "@/lib/map/styles";

type Props = {
  mapStyle: MapStyleKind;
  onMapStyleChange: (style: MapStyleKind) => void;
  viewMode: "globe" | "flat2d";
  onViewModeChange: (mode: "globe" | "flat2d") => void;
  globeAvailable: boolean;
};

export default function MapStyleToggle({
  mapStyle,
  onMapStyleChange,
  viewMode,
  onViewModeChange,
  globeAvailable,
}: Props) {
  const hasSatellite = satelliteStyleAvailable();

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest">
      {globeAvailable ? (
        <div className="inline-flex overflow-hidden rounded border border-white/20">
          <button
            type="button"
            onClick={() => onViewModeChange("globe")}
            className={`px-3 py-1.5 font-mono ${viewMode === "globe" ? "bg-electric-yellow text-black" : "bg-black text-slate-300"}`}
          >
            Globo 3D
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("flat2d")}
            className={`px-3 py-1.5 font-mono ${viewMode === "flat2d" ? "bg-electric-yellow text-black" : "bg-black text-slate-300"}`}
          >
            Mapa 2D
          </button>
        </div>
      ) : null}
      {hasSatellite && viewMode === "globe" ? (
        <div className="inline-flex overflow-hidden rounded border border-white/20">
          <button
            type="button"
            onClick={() => onMapStyleChange("streets")}
            className={`px-3 py-1.5 font-mono ${mapStyle === "streets" ? "bg-electric-blue text-white" : "bg-black text-slate-300"}`}
          >
            Calles
          </button>
          <button
            type="button"
            onClick={() => onMapStyleChange("satellite")}
            className={`px-3 py-1.5 font-mono ${mapStyle === "satellite" ? "bg-electric-blue text-white" : "bg-black text-slate-300"}`}
          >
            Satélite
          </button>
        </div>
      ) : null}
    </div>
  );
}
