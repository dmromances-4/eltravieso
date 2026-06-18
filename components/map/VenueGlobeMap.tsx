"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import Map, {
  Layer,
  NavigationControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import type { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { VenueContinent } from "@prisma/client";
import type { MapVenueDTO } from "@/lib/venues/types";
import { CONTINENT_CAMERA, type ContinentFilter } from "@/lib/venues/continents";
import { getMapStyleUrl, getTerrainUrl, type MapStyleKind } from "@/lib/map/styles";
import { registerVenueMapIcons } from "@/lib/map/venue-map-icons";
import { venuesToGeoJson } from "@/components/map/venuesToGeoJson";

export type VenueGlobeMapHandle = {
  flyToContinent: (continent: ContinentFilter) => void;
  flyToVenue: (venue: MapVenueDTO) => void;
  flyToUser: (lng: number, lat: number) => void;
};

type MapProjection = "vertical-perspective" | "mercator";

type Props = {
  venues: MapVenueDTO[];
  mapStyle: MapStyleKind;
  reduceMotion: boolean;
  projection: MapProjection;
  selectedId: string | null;
  onSelectVenue: (venue: MapVenueDTO | null) => void;
  flyContinent: ContinentFilter;
  onMapError?: () => void;
};

const VenueGlobeMap = forwardRef<VenueGlobeMapHandle, Props>(function VenueGlobeMap(
  { venues, mapStyle, reduceMotion, projection, selectedId, onSelectVenue, flyContinent, onMapError },
  ref,
) {
  const t = useTranslations("map");
  const mapRef = useRef<MapRef>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const venuesById = useMemo(() => new globalThis.Map(venues.map((v) => [v.id, v])), [venues]);
  const styleUrl = getMapStyleUrl(mapStyle) ?? getMapStyleUrl("streets")!;
  const geojson = useMemo(() => venuesToGeoJson(venues), [venues]);
  const isGlobe = projection === "vertical-perspective";

  const fly = useCallback(
    (options: {
      longitude: number;
      latitude: number;
      zoom: number;
      pitch?: number;
      bearing?: number;
    }) => {
      const map = mapRef.current?.getMap();
      if (!map) return;
      map.flyTo({
        ...options,
        duration: reduceMotion ? 0 : 1800,
        essential: true,
      });
    },
    [reduceMotion],
  );

  useImperativeHandle(ref, () => ({
    flyToContinent(continent: ContinentFilter) {
      if (!continent) {
        fly({ longitude: 10, latitude: 20, zoom: 1.2, pitch: 0 });
        return;
      }
      const cam = CONTINENT_CAMERA[continent as VenueContinent];
      fly(cam);
    },
    flyToVenue(venue: MapVenueDTO) {
      fly({
        longitude: venue.longitude,
        latitude: venue.latitude,
        zoom: 12,
        pitch: isGlobe ? 45 : 0,
      });
    },
    flyToUser(lng: number, lat: number) {
      fly({ longitude: lng, latitude: lat, zoom: 8, pitch: isGlobe ? 30 : 0 });
    },
  }));

  useEffect(() => {
    if (!flyContinent) return;
    const cam = CONTINENT_CAMERA[flyContinent as VenueContinent];
    fly(cam);
  }, [flyContinent, fly]);

  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    void registerVenueMapIcons(map).catch(() => undefined);

    map.setProjection({ type: projection });
    if (isGlobe) {
      map.setSky({
        "sky-color": "rgb(186, 210, 235)",
        "horizon-color": "rgb(36, 92, 223)",
        "fog-color": "rgb(11, 11, 25)",
        "atmosphere-blend": 0.9,
        "horizon-fog-blend": 0.04,
      });
    }

    const terrainUrl = getTerrainUrl();
    if (isGlobe && terrainUrl && !map.getSource("terrain")) {
      map.addSource("terrain", {
        type: "raster-dem",
        url: terrainUrl,
        tileSize: 256,
      });
      map.setTerrain({ source: "terrain", exaggeration: 1.1 });
    }
  }, [projection, isGlobe]);

  const onClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature) {
        onSelectVenue(null);
        return;
      }

      if (feature.properties?.point_count != null) {
        const map = mapRef.current?.getMap();
        const clusterId = Number(feature.properties.cluster_id);
        const source = map?.getSource("venues") as GeoJSONSource | undefined;
        const coords = (feature.geometry as GeoJSON.Point).coordinates;
        void source
          ?.getClusterExpansionZoom(clusterId)
          .then((zoom) => {
            fly({ longitude: coords[0], latitude: coords[1], zoom, pitch: isGlobe ? 35 : 0 });
          })
          .catch(() => undefined);
        return;
      }

      const id = feature.properties?.id as string | undefined;
      const venue = id ? venuesById.get(id) : undefined;
      if (!venue) {
        onSelectVenue(null);
        return;
      }
      onSelectVenue(venue);
      fly({
        longitude: venue.longitude,
        latitude: venue.latitude,
        zoom: 12,
        pitch: isGlobe ? 45 : 0,
      });
    },
    [fly, isGlobe, onSelectVenue, venuesById],
  );

  const onMapErrorHandler = useCallback(
    (event: { error?: Error }) => {
      const message = event.error?.message ?? "Map style failed to load";
      setMapError(message);
      onMapError?.();
      if (process.env.NODE_ENV === "development") {
        console.error("[VenueGlobeMap]", event.error);
      }
    },
    [onMapError],
  );

  if (mapError) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4 rounded-[2rem] border border-white/10 bg-[#111] p-8 text-center">
        <p className="text-slate-300">{t("mapStyleError")}</p>
        <p className="text-sm text-slate-500">{mapError}</p>
        {onMapError ? (
          <button
            type="button"
            onClick={onMapError}
            className="rounded-full border border-electric-yellow/40 bg-electric-yellow/10 px-6 py-2 text-sm font-bold uppercase tracking-widest text-electric-yellow transition hover:bg-electric-yellow/20"
          >
            {t("switchTo2d")}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="h-[70vh] overflow-hidden rounded-[2rem] border border-white/10 shadow-neon">
      <Map
        ref={mapRef}
        mapStyle={styleUrl}
        initialViewState={{
          longitude: 10,
          latitude: 20,
          zoom: isGlobe ? 1.2 : 2,
          pitch: 0,
          bearing: 0,
        }}
        style={{ width: "100%", height: "100%" }}
        onLoad={onMapLoad}
        onError={onMapErrorHandler}
        interactiveLayerIds={["clusters", "unclustered-point"]}
        onClick={onClick}
      >
        <NavigationControl position="top-left" visualizePitch={isGlobe} />
        <Source
          id="venues"
          type="geojson"
          data={geojson}
          cluster
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer
            id="clusters"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": "#F9D142",
              "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 50, 32],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#0a0a0a",
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              "text-field": "{point_count_abbreviated}",
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
              "text-size": 12,
            }}
            paint={{ "text-color": "#0a0a0a" }}
          />
          <Layer
            id="unclustered-point"
            type="symbol"
            filter={["!", ["has", "point_count"]]}
            layout={{
              "icon-image": ["get", "markerIcon"],
              "icon-size": [
                "case",
                ["==", ["get", "id"], selectedId ?? ""],
                1.15,
                1,
              ],
              "icon-anchor": "bottom",
              "icon-allow-overlap": true,
            }}
          />
        </Source>
      </Map>
    </div>
  );
});

export default VenueGlobeMap;

