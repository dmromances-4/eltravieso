"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { VenueContinent } from "@prisma/client";
import type { ContinentFilter } from "@/lib/venues/continents";
import type { MapVenueDTO } from "@/lib/venues/types";
import { dedupeMapVenues } from "@/lib/venues/map-dedup";
import { haversineKm } from "@/lib/map/haversine";

export type UserPosition = { lat: number; lng: number };

async function fetchVenueList(url: string): Promise<MapVenueDTO[]> {
  const response = await fetch(url);
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(payload.message ?? `HTTP ${response.status}`);
  }
  const data = (await response.json()) as { venues?: MapVenueDTO[]; bars?: MapVenueDTO[] };
  return (data.venues ?? data.bars ?? []) as MapVenueDTO[];
}

export function useVenueMapData() {
  const [affiliates, setAffiliates] = useState<MapVenueDTO[]>([]);
  const [editorial, setEditorial] = useState<MapVenueDTO[]>([]);
  const [showAffiliates, setShowAffiliates] = useState(true);
  const [showEditorial, setShowEditorial] = useState(true);
  const [continent, setContinent] = useState<ContinentFilter>("");
  const [hideLowConfidence, setHideLowConfidence] = useState(false);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const load = useCallback(async (filter: ContinentFilter) => {
    setLoading(true);
    setError(null);
    const qs = filter ? `?continent=${filter}` : "";
    try {
      const [bars, venues] = await Promise.all([
        fetchVenueList("/api/bars"),
        fetchVenueList(`/api/venues/guide${qs}`),
      ]);
      setAffiliates(bars);
      setEditorial(venues);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error cargando el mapa";
      setError(message);
      setAffiliates([]);
      setEditorial([]);
      if (process.env.NODE_ENV === "development") {
        console.error("[useVenueMapData]", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(continent);
  }, [continent, load, reloadToken]);

  const retry = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  const deduped = useMemo(() => dedupeMapVenues(affiliates, editorial), [affiliates, editorial]);

  const baseVisible = useMemo(() => {
    const out: MapVenueDTO[] = [];
    if (showAffiliates) out.push(...deduped.filter((v) => v.layer === "affiliate"));
    if (showEditorial) out.push(...deduped.filter((v) => v.layer === "editorial"));
    return out;
  }, [deduped, showAffiliates, showEditorial]);

  const visibleVenues = useMemo(() => {
    if (!hideLowConfidence) return baseVisible;
    return baseVisible.filter((v) => v.geocodeConfidence !== "low");
  }, [baseVisible, hideLowConfidence]);

  const venuesSortedByDistance = useMemo(() => {
    if (!userPosition) return [];
    return [...visibleVenues]
      .map((v) => ({
        venue: v,
        km: haversineKm(userPosition.lat, userPosition.lng, v.latitude, v.longitude),
      }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 8);
  }, [visibleVenues, userPosition]);

  const center = useMemo(() => {
    if (userPosition) return { lat: userPosition.lat, lng: userPosition.lng };
    if (visibleVenues.length === 0) return { lat: 41.3874, lng: 2.1686 };
    const lat = visibleVenues.reduce((s, v) => s + v.latitude, 0) / visibleVenues.length;
    const lng = visibleVenues.reduce((s, v) => s + v.longitude, 0) / visibleVenues.length;
    return { lat, lng };
  }, [visibleVenues, userPosition]);

  const flyContinent = continent || ("" as ContinentFilter);

  const findVenueBySlug = useCallback(
    (slug: string) => deduped.find((v) => v.slug === slug) ?? null,
    [deduped],
  );

  const hasRawData = affiliates.length > 0 || editorial.length > 0;
  const hasMapPins = deduped.length > 0;

  return {
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
    userPosition,
    setUserPosition,
    loading,
    error,
    retry,
    visibleVenues,
    venuesSortedByDistance,
    center,
    flyContinent: flyContinent as VenueContinent | "",
    findVenueBySlug,
    hasRawData,
    hasMapPins,
  };
}
