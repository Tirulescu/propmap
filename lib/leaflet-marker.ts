import type { DivIcon } from "leaflet";
import type { PropertyType } from "@/lib/db/types";
import { PROPERTY_TYPE_EMOJI } from "@/lib/property-types";

export function createLocationMarkerIcon(L: typeof import("leaflet")): DivIcon {
  return L.divIcon({
    className: "location-marker-icon",
    html: `<span style="display:block;width:20px;height:20px;background:#4A6E47;border:3px solid #F7F4EF;border-radius:50%;box-shadow:0 2px 8px rgba(26,21,16,0.35);"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export function createPropertyTypeMarkerIcon(
  L: typeof import("leaflet"),
  type: PropertyType
): DivIcon {
  const emoji = PROPERTY_TYPE_EMOJI[type] ?? "📍";
  return L.divIcon({
    className: "property-type-marker-icon",
    html: `<span class="property-type-marker" aria-hidden="true">${emoji}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}
