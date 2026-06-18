"use client";

import { Link } from "@/i18n/navigation";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapVenueDTO } from "@/lib/venues/types";
import { venueMarkerColor } from "@/components/map/map-constants";

type Props = {
  venues: MapVenueDTO[];
  center: { lat: number; lng: number };
  onSelectVenue?: (venue: MapVenueDTO | null) => void;
};

function pinIcon(venue: MapVenueDTO) {
  const color = venueMarkerColor(venue.venueType, venue.layer, venue.isPremium);
  const inner =
    venue.layer === "editorial"
      ? `<text x="14" y="17" text-anchor="middle" font-size="9" font-weight="bold" fill="#0a0a0a">50</text>`
      : venue.isPremium
        ? `<text x="14" y="17" text-anchor="middle" font-size="9" font-weight="bold" fill="#F9D142">★</text>`
        : `<circle fill="#0a0a0a" cx="14" cy="14" r="5"/>`;
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path fill="${color}" stroke="#0a0a0a" stroke-width="1.5" d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z"/>${inner}</svg>`,
  );
  return L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32],
  });
}

export default function VenueMapLeaflet({ venues, center, onSelectVenue }: Props) {
  return (
    <div className="h-[70vh] overflow-hidden rounded-[2rem] border border-white/10 shadow-neon">
      <MapContainer center={[center.lat, center.lng]} zoom={3} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {venues.map((venue) => (
          <Marker
            key={`${venue.layer}-${venue.id}`}
            position={[venue.latitude, venue.longitude]}
            icon={pinIcon(venue)}
            eventHandlers={{
              click: () => onSelectVenue?.(venue),
            }}
          >
            <Popup>
              <div className="min-w-[200px] space-y-3 p-1 text-sm text-black">
                {venue.venueCode ? (
                  <p className="font-mono text-xs text-amber-700">{venue.venueCode}</p>
                ) : null}
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
  );
}
