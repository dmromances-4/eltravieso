"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { MapVenueDTO } from "@/lib/venues/types";
import type { MapStyleKind } from "@/lib/map/styles";
import { hasWebGLSupport, prefersReducedMotion } from "@/lib/map/webgl";
import { satelliteStyleAvailable } from "@/lib/map/styles";
import { useVenueMapData } from "@/components/map/useVenueMapData";
import VenueMapControls, { VenueNearbyList } from "@/components/map/VenueMapControls";
import MapStyleToggle from "@/components/map/MapStyleToggle";
import VenueMapPanel from "@/components/map/VenueMapPanel";
import VenueGlobeMap, { type VenueGlobeMapHandle } from "@/components/map/VenueGlobeMap";
import VenueMapLeaflet from "@/components/map/VenueMapLeaflet";

type Props = {
  initialSlug?: string | null;
};

export default function VenueMapShell({ initialSlug = null }: Props) {
  const t = useTranslations("map");
  const {
    affiliates,
    editorial,
    showAffiliates,
    setShowAffiliates,
    showEditorial,
    setShowEditorial,
    continent,
    setContinent,
    hideLowConfidence,
    setHideLowConfidence,
    setUserPosition,
    loading,
    error,
    retry,
    visibleVenues,
    venuesSortedByDistance,
    center,
    flyContinent,
    findVenueBySlug,
    hasRawData,
    hasMapPins,
  } = useVenueMapData();

  const globeRef = useRef<VenueGlobeMapHandle>(null);
  const [canWebGL, setCanWebGL] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [viewMode, setViewMode] = useState<"globe" | "flat2d">("globe");
  const [mapStyle, setMapStyle] = useState<MapStyleKind>("streets");
  const [selected, setSelected] = useState<MapVenueDTO | null>(null);
  const [locating, setLocating] = useState(false);
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);

  useEffect(() => {
    setCanWebGL(hasWebGLSupport());
    setReduceMotion(prefersReducedMotion());
  }, []);

  const useLeaflet = !canWebGL || reduceMotion;
  const useMapLibre = canWebGL && !reduceMotion;
  const useGlobe = useMapLibre && viewMode === "globe";
  const useFlatMapLibre = useMapLibre && viewMode === "flat2d";

  useEffect(() => {
    if (deepLinkHandled || loading || !initialSlug) return;
    const venue = findVenueBySlug(initialSlug);
    if (!venue) return;
    setSelected(venue);
    setDeepLinkHandled(true);
    if (useGlobe || useFlatMapLibre) {
      globeRef.current?.flyToVenue(venue);
    }
  }, [deepLinkHandled, loading, initialSlug, findVenueBySlug, useGlobe, useFlatMapLibre]);

  const handleLocateUser = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;
        setUserPosition({ lat: latitude, lng: longitude });
        globeRef.current?.flyToUser(longitude, latitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const handleSelectVenue = (venue: MapVenueDTO | null) => {
    if (!venue) {
      setSelected(null);
      return;
    }
    const full = visibleVenues.find((v) => v.id === venue.id) ?? venue;
    setSelected(full);
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center rounded-card border border-slate-200 bg-white text-slate-500 shadow-sm">
        {t("loadingVenues")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4 rounded-card border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-700">{t("loadError")}</p>
        <p className="text-sm text-slate-500">{error}</p>
        <button
          type="button"
          onClick={retry}
          className="rounded-pill border border-electric-yellow bg-electric-yellow/20 px-6 py-2 text-sm font-bold uppercase tracking-widest text-slate-900 transition hover:bg-electric-yellow/40"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  if (!hasMapPins && !hasRawData) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4 rounded-card border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-600">{t("emptyNoCoordinates")}</p>
        <p className="text-sm text-slate-500">
          {t.rich("emptySeedHint", {
            command: (chunks) => <code className="text-electric-blue">{chunks}</code>,
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <VenueMapControls
          affiliatesCount={affiliates.length}
          editorialCount={editorial.length}
          showAffiliates={showAffiliates}
          showEditorial={showEditorial}
          onToggleAffiliates={setShowAffiliates}
          onToggleEditorial={setShowEditorial}
          continent={continent}
          onContinentChange={setContinent}
          hideLowConfidence={hideLowConfidence}
          onHideLowConfidenceChange={setHideLowConfidence}
          onLocateUser={useMapLibre ? handleLocateUser : undefined}
          locating={locating}
        />
        <MapStyleToggle
          mapStyle={mapStyle}
          onMapStyleChange={setMapStyle}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          globeAvailable={useMapLibre}
        />
      </div>

      {mapStyle === "satellite" && !satelliteStyleAvailable() ? (
        <p className="rounded-card border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("missingMaptilerKey")}
        </p>
      ) : null}

      {visibleVenues.length === 0 ? (
        <div className="flex h-[40vh] items-center justify-center rounded-card border border-slate-200 bg-white text-slate-500 shadow-sm">
          {t("emptyActivateLayer")}
        </div>
      ) : (
        <div className="relative md:flex md:gap-4 lg:flex lg:gap-4">
          <div className="min-w-0 flex-1">
            {useGlobe ? (
              <VenueGlobeMap
                ref={globeRef}
                venues={visibleVenues}
                mapStyle={mapStyle}
                reduceMotion={reduceMotion}
                projection="vertical-perspective"
                selectedId={selected?.id ?? null}
                onSelectVenue={handleSelectVenue}
                flyContinent={flyContinent}
                onMapError={() => setViewMode("flat2d")}
              />
            ) : useFlatMapLibre ? (
              <VenueGlobeMap
                ref={globeRef}
                venues={visibleVenues}
                mapStyle={mapStyle}
                reduceMotion={reduceMotion}
                projection="mercator"
                selectedId={selected?.id ?? null}
                onSelectVenue={handleSelectVenue}
                flyContinent={flyContinent}
                onMapError={() => setViewMode("flat2d")}
              />
            ) : (
              <VenueMapLeaflet
                venues={visibleVenues}
                center={center}
                onSelectVenue={handleSelectVenue}
              />
            )}
          </div>
          {selected ? <VenueMapPanel venue={selected} onClose={() => setSelected(null)} /> : null}
        </div>
      )}

      {venuesSortedByDistance.length > 0 ? (
        <VenueNearbyList items={venuesSortedByDistance} />
      ) : null}
    </div>
  );
}

