import type { DbProperty } from "@/lib/db/types";
import { normalizeGeoPolygon } from "@/lib/geo-polygon";
import { hasSavedLocation } from "@/lib/maps-url";
import { createLocationMarkerIcon } from "@/lib/leaflet-marker";
import { POPUP_POLYGON_STYLE, SATELLITE_TILE_LAYER } from "@/lib/map-constants";

const instances = new Map<string, import("leaflet").Map>();

export function destroyPopupMiniMap(propertyId: string) {
  const map = instances.get(propertyId);
  if (!map) return;
  map.remove();
  instances.delete(propertyId);
}

export function destroyAllPopupMiniMaps() {
  for (const id of [...instances.keys()]) {
    destroyPopupMiniMap(id);
  }
}

export async function mountPopupMiniMap(
  container: HTMLElement,
  property: DbProperty
) {
  destroyPopupMiniMap(property.id);

  const L = await import("leaflet");

  L.DomEvent.disableClickPropagation(container);
  L.DomEvent.disableScrollPropagation(container);

  const map = L.map(container, {
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    touchZoom: false,
    doubleClickZoom: false,
    scrollWheelZoom: false,
    boxZoom: false,
    keyboard: false,
  });

  L.tileLayer(SATELLITE_TILE_LAYER.url, { maxZoom: 19 }).addTo(map);

  const overlay = L.layerGroup().addTo(map);
  let bounds: ReturnType<typeof L.latLngBounds> | null = null;

  const polygonData = normalizeGeoPolygon(property.geo_polygon);
  if (polygonData) {
    try {
      const geo = L.geoJSON(polygonData, { style: POPUP_POLYGON_STYLE }).addTo(overlay);
      const polyBounds = geo.getBounds();
      if (polyBounds.isValid()) {
        bounds = polyBounds;
      }
    } catch {}
  }

  const lat = property.location_lat;
  const lng = property.location_lng;
  if (hasSavedLocation(lat, lng)) {
    const safeLat = lat as number;
    const safeLng = lng as number;
    L.marker([safeLat, safeLng], { icon: createLocationMarkerIcon(L) }).addTo(overlay);
    const pinBounds = L.latLngBounds([safeLat, safeLng], [safeLat, safeLng]);
    bounds = bounds?.isValid() ? bounds.extend(pinBounds) : pinBounds;
  }

  if (bounds?.isValid()) {
    map.fitBounds(bounds, { padding: [6, 6], maxZoom: 18 });
  } else if (hasSavedLocation(lat, lng)) {
    map.setView([lat as number, lng as number], 16);
  }

  instances.set(property.id, map);

  const refreshSize = () => {
    map.invalidateSize({ animate: false });
  };

  requestAnimationFrame(refreshSize);
  setTimeout(refreshSize, 50);
  setTimeout(refreshSize, 200);
}

export function popupPreviewId(propertyId: string) {
  return `popup-preview-${propertyId}`;
}
