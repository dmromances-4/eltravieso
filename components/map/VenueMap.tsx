"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CONTINENT_LABELS } from "@/lib/venues/continents";
import { brandColors } from "@/lib/theme/tokens";

type MapVenue = {
  id: string;
  slug: string;
  name: string;
  venueType: string;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string;
  photoUrl: string | null;
  profileUrl: string;
  layer: "affiliate" | "editorial";
  worlds50bestRank: number | null;
  continent?: string | null;
  regionalRank?: number | null;
  isPremium?: boolean;
};

type ContinentFilter = "" | "GLOBAL" | "EUROPE" | "ASIA" | "NORTH_AMERICA" | "LATIN_AMERICA";

const VENUE_COLORS: Record<string, string> = {
  cocteleria: brandColors.yellow,
  restaurante: brandColors.blue,
  bar: brandColors.red,
  bodega: "#9B59B6",
};

const CONTINENT_OPTIONS: { value: ContinentFilter; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "GLOBAL", label: CONTINENT_LABELS.GLOBAL },
  { value: "EUROPE", label: CONTINENT_LABELS.EUROPE },
  { value: "ASIA", label: CONTINENT_LABELS.ASIA },
  { value: "NORTH_AMERICA", label: CONTINENT_LABELS.NORTH_AMERICA },
  { value: "LATIN_AMERICA", label: CONTINENT_LABELS.LATIN_AMERICA },
];

function affiliateIcon(venueType: string, isPremium?: boolean) {
  const color = isPremium ? brandColors.red : (VENUE_COLORS[venueType] ?? VENUE_COLORS.bar);
  const star = isPremium
    ? `<text x="14" y="17" text-anchor="middle" font-size="9" font-weight="bold" fill="${brandColors.yellow}">★</text>`
    : `<circle fill="#0a0a0a" cx="14" cy="14" r="5"/>`;
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path fill="${color}" stroke="#0a0a0a" stroke-width="1.5" d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z"/>${star}</svg>`,
  );
  return L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32],
  });
}

function editorialIcon() {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38"><path fill="${brandColors.yellow}" stroke="#0a0a0a" stroke-width="2" d="M15 1C7 1 1 7 1 15c0 11 14 22 14 22s14-11 14-22C29 7 23 1 15 1z"/><text x="15" y="18" text-anchor="middle" font-size="10" font-weight="bold" fill="#0a0a0a">50</text></svg>`,
  );
  return L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -34],
  });
}

export default function VenueMap() {
  const [affiliates, setAffiliates] = useState<MapVenue[]>([]);
  const [editorial, setEditorial] = useState<MapVenue[]>([]);
  const [showAffiliates, setShowAffiliates] = useState(true);
  const [showEditorial, setShowEditorial] = useState(true);
  const [continent, setContinent] = useState<ContinentFilter>("");
  const [loading, setLoading] = useState(true);

  const loadEditorial = useCallback((filter: ContinentFilter) => {
    const qs = filter ? `?continent=${filter}` : "";
    return fetch(`/api/venues/guide${qs}`)
      .then((r) => r.json())
      .then((data) => setEditorial(data.venues ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/bars").then((r) => r.json()),
      loadEditorial(continent),
    ])
      .then(([barsData]) => {
        setAffiliates(barsData.bars ?? []);
      })
      .finally(() => setLoading(false));
  }, [continent, loadEditorial]);

  const visibleVenues = useMemo(() => {
    const out: MapVenue[] = [];
    if (showAffiliates) out.push(...affiliates);
    if (showEditorial) out.push(...editorial);
    return out;
  }, [affiliates, editorial, showAffiliates, showEditorial]);

  const center = useMemo(() => {
    if (visibleVenues.length === 0) return { lat: 41.3874, lng: 2.1686 };
    const lat = visibleVenues.reduce((s, v) => s + v.latitude, 0) / visibleVenues.length;
    const lng = visibleVenues.reduce((s, v) => s + v.longitude, 0) / visibleVenues.length;
    return { lat, lng };
  }, [visibleVenues]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center rounded-[2rem] border border-white/10 bg-[#111] text-slate-400">
        Cargando locales…
      </div>
    );
  }

  if (visibleVenues.length === 0 && affiliates.length === 0 && editorial.length === 0) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4 rounded-[2rem] border border-white/10 bg-[#111] p-8 text-center">
        <p className="text-slate-400">Aún no hay locales con coordenadas en el mapa.</p>
        <p className="text-sm text-slate-500">
          Importa destacados con <code className="text-electric-yellow">npm run seed:venues</code> o activa
          &quot;Visible en mapa&quot; en Mi local.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest">
        <label className="flex cursor-pointer items-center gap-2 text-slate-300">
          <input
            type="checkbox"
            checked={showAffiliates}
            onChange={(e) => setShowAffiliates(e.target.checked)}
            className="accent-electric-yellow"
          />
          Red El Travieso ({affiliates.length})
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-slate-300">
          <input
            type="checkbox"
            checked={showEditorial}
            onChange={(e) => setShowEditorial(e.target.checked)}
            className="accent-electric-yellow"
          />
          Destacados 50 Best ({editorial.length})
        </label>
        <label className="flex items-center gap-2 border-l border-white/10 pl-4 text-slate-300">
          <span>Continente</span>
          <select
            value={continent}
            onChange={(e) => setContinent(e.target.value as ContinentFilter)}
            className="rounded border border-white/20 bg-black px-2 py-1 font-mono text-xs normal-case text-white"
          >
            {CONTINENT_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-4 border-l border-white/10 pl-4">
          {Object.entries(VENUE_COLORS).map(([type, color]) => (
            <span key={type} className="flex items-center gap-2 text-slate-400">
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
              {type}
            </span>
          ))}
        </div>
      </div>

      {visibleVenues.length === 0 ? (
        <div className="flex h-[40vh] items-center justify-center rounded-[2rem] border border-white/10 bg-[#111] text-slate-500">
          Activa al menos una capa del mapa.
        </div>
      ) : (
        <div className="h-[70vh] overflow-hidden rounded-[2rem] border border-white/10 shadow-neon">
          <MapContainer center={[center.lat, center.lng]} zoom={3} className="h-full w-full" scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {visibleVenues.map((venue) => (
              <Marker
                key={`${venue.layer}-${venue.id}`}
                position={[venue.latitude, venue.longitude]}
                icon={venue.layer === "editorial" ? editorialIcon() : affiliateIcon(venue.venueType, venue.isPremium)}
              >
                <Popup>
                  <div className="min-w-[200px] space-y-3 p-1 text-sm text-black">
                    {venue.isPremium ? (
                      <p className="text-xs font-bold uppercase text-red-600">Top del Barrio</p>
                    ) : null}
                    {venue.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={venue.photoUrl} alt={venue.name} className="h-24 w-full rounded-lg object-cover" />
                    ) : null}
                    {venue.worlds50bestRank ? (
                      <p className="text-xs font-bold uppercase text-amber-600">
                        World&apos;s 50 Best #{venue.worlds50bestRank}
                      </p>
                    ) : null}
                    {venue.regionalRank ? (
                      <p className="text-xs font-bold uppercase text-sky-700">
                        Regional #{venue.regionalRank}
                      </p>
                    ) : null}
                    <p className="font-bold">{venue.name}</p>
                    <p className="text-xs text-gray-600">
                      {venue.address ? `${venue.address}, ` : ""}
                      {venue.city}
                    </p>
                    <Link
                      href={venue.profileUrl}
                      className="inline-block rounded-full bg-black px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
                    >
                      Ver ficha
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
