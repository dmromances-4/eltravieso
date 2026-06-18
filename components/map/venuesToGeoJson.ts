import type { MapVenueDTO } from "@/lib/venues/types";
import { venueMarkerColor } from "@/components/map/map-constants";
import { resolveVenueIconId } from "@/lib/map/venue-map-icons";

export type VenueFeatureProps = {
  id: string;
  venueCode: string | null;
  slug: string;
  name: string;
  venueType: string;
  layer: string;
  city: string;
  address: string | null;
  photoUrl: string | null;
  profileUrl: string;
  worlds50bestRank: number | null;
  regionalRank: number | null;
  isPremium: boolean;
  color: string;
  tripadvisorRating: number | null;
  geocodeConfidence: string | null;
  markerIcon: string;
};

export function venuesToGeoJson(venues: MapVenueDTO[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: venues.map((venue) => ({
      type: "Feature",
      id: venue.id,
      properties: {
        id: venue.id,
        venueCode: venue.venueCode ?? null,
        slug: venue.slug,
        name: venue.name,
        venueType: venue.venueType,
        layer: venue.layer,
        city: venue.city,
        address: venue.address,
        photoUrl: venue.photoUrl,
        profileUrl: venue.profileUrl,
        worlds50bestRank: venue.worlds50bestRank,
        regionalRank: venue.regionalRank,
        isPremium: Boolean(venue.isPremium),
        color: venueMarkerColor(venue.venueType, venue.layer, venue.isPremium),
        tripadvisorRating: venue.tripadvisorRating ?? null,
        geocodeConfidence: venue.geocodeConfidence ?? null,
        markerIcon: resolveVenueIconId(venue.venueType, venue.layer, venue.isPremium),
      } satisfies VenueFeatureProps,
      geometry: {
        type: "Point",
        coordinates: [venue.longitude, venue.latitude],
      },
    })),
  };
}

export function featureToMapVenue(
  props: VenueFeatureProps,
  coordinates: [number, number],
): MapVenueDTO {
  return {
    id: props.id,
    venueCode: props.venueCode,
    slug: props.slug,
    name: props.name,
    venueType: props.venueType,
    latitude: coordinates[1],
    longitude: coordinates[0],
    address: props.address,
    city: props.city,
    photoUrl: props.photoUrl,
    profileUrl: props.profileUrl,
    layer: props.layer as MapVenueDTO["layer"],
    worlds50bestRank: props.worlds50bestRank,
    continent: null,
    regionalRank: props.regionalRank,
    isPremium: props.isPremium,
    geocodeConfidence: props.geocodeConfidence as MapVenueDTO["geocodeConfidence"],
    tripadvisorRating: props.tripadvisorRating,
    history: null,
    verdict: null,
    externalWebsite: null,
  };
}
