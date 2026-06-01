"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map, TileLayer } from "leaflet";
import DirectionsLink from "@/app/components/directions-link";
import { normalizeGeoPolygon } from "@/lib/geo-polygon";
import { hasSavedLocation } from "@/lib/maps-url";
import { createLocationMarkerIcon } from "@/lib/leaflet-marker";
import {
  DEFAULT_MAP_CENTER,
  MAP_TILE_LAYERS,
  PROPERTY_POLYGON_STYLE,
  type MapTileKey,
} from "@/lib/map-constants";

interface Props {
  lat: number | null;
  lng: number | null;
  geoPolygon?: unknown;
  address?: string | null;
}

export default function PropertyMapView({ lat, lng, geoPolygon, address }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const tileRef = useRef<TileLayer | null>(null);
  const skipTileSwapRef = useRef(true);
  const [tileKey, setTileKey] = useState<MapTileKey>("satellite");

  const showPin = hasSavedLocation(lat, lng);
  const polygonData = useMemo(() => normalizeGeoPolygon(geoPolygon), [geoPolygon]);
  const viewLat = lat ?? DEFAULT_MAP_CENTER.lat;
  const viewLng = lng ?? DEFAULT_MAP_CENTER.lng;
  const showDirections = showPin || !!address?.trim();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;
    let resizeObserver: ResizeObserver | null = null;

    async function init() {
      const L = await import("leaflet");
      if (destroyed || !containerRef.current) return;

      const map = L.map(containerRef.current, { zoomControl: false });
      mapRef.current = map;

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const opt = MAP_TILE_LAYERS[tileKey];
      tileRef.current = L.tileLayer(opt.url, {
        attribution: opt.attribution,
        maxZoom: 19,
      }).addTo(map);

      const overlay = L.layerGroup().addTo(map);
      let bounds: ReturnType<typeof L.latLngBounds> | null = null;

      if (polygonData) {
        try {
          const geo = L.geoJSON(polygonData, { style: PROPERTY_POLYGON_STYLE }).addTo(overlay);
          const polyBounds = geo.getBounds();
          if (polyBounds.isValid()) {
            bounds = polyBounds;
          }
        } catch {}
      }

      if (showPin && lat != null && lng != null) {
        L.marker([lat, lng], { icon: createLocationMarkerIcon(L) }).addTo(overlay);
        const pinBounds = L.latLngBounds([lat, lng], [lat, lng]);
        bounds = bounds ? bounds.extend(pinBounds) : pinBounds;
      }

      if (bounds?.isValid()) {
        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 17 });
      } else {
        map.setView([viewLat, viewLng], 15);
      }

      const refreshSize = () => {
        if (!destroyed && mapRef.current) {
          mapRef.current.invalidateSize({ animate: false });
        }
      };

      requestAnimationFrame(refreshSize);
      setTimeout(refreshSize, 150);

      resizeObserver = new ResizeObserver(refreshSize);
      resizeObserver.observe(containerRef.current);
    }

    init();

    return () => {
      destroyed = true;
      resizeObserver?.disconnect();
      skipTileSwapRef.current = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      tileRef.current = null;
    };
  }, [lat, lng, polygonData, showPin, viewLat, viewLng]);

  useEffect(() => {
    if (skipTileSwapRef.current) {
      skipTileSwapRef.current = false;
      return;
    }

    let cancelled = false;

    async function swap() {
      const L = await import("leaflet");
      if (cancelled) return;

      const map = mapRef.current;
      const old = tileRef.current;
      if (!map || !old) return;

      const opt = MAP_TILE_LAYERS[tileKey];
      const next = L.tileLayer(opt.url, {
        attribution: opt.attribution,
        maxZoom: 19,
      });
      next.addTo(map);
      old.remove();
      tileRef.current = next;
    }

    swap();
    return () => {
      cancelled = true;
    };
  }, [tileKey]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full h-[420px] sm:h-[520px] rounded-lg border border-[#E8DCC4] overflow-hidden"
      />
      <div className="map-overlay-controls">
        {showDirections && (
          <DirectionsLink lat={lat} lng={lng} address={address} />
        )}
        <select
          value={tileKey}
          onChange={(e) => setTileKey(e.target.value as MapTileKey)}
          className="map-toolbar-select map-toolbar-select--overlay"
          aria-label="Tipo de mapa"
        >
          {(Object.keys(MAP_TILE_LAYERS) as MapTileKey[]).map((key) => (
            <option key={key} value={key}>
              {MAP_TILE_LAYERS[key].label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
