"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { LoadingLabel } from "@/app/components/loading-label";
import { SearchInput } from "@/app/components/search-input";
import type { LatLng, Map, Marker, TileLayer } from "leaflet";
import { createLocationMarkerIcon } from "@/lib/leaflet-marker";
import {
  DEFAULT_MAP_CENTER,
  MAP_TILE_LAYERS,
  type MapTileKey,
} from "@/lib/map-constants";
import { searchNominatim } from "@/lib/nominatim";

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  readOnly?: boolean;
  heightClass?: string;
}

export default function LocationPicker({
  lat,
  lng,
  onChange,
  readOnly = false,
  heightClass = "h-[240px] sm:h-[280px]",
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const tileRef = useRef<TileLayer | null>(null);
  const onChangeRef = useRef(onChange);

  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [tileKey, setTileKey] = useState<MapTileKey>("street");

  const centerLat = lat ?? DEFAULT_MAP_CENTER.lat;
  const centerLng = lng ?? DEFAULT_MAP_CENTER.lng;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;

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

      map.setView([centerLat, centerLng], lat != null && lng != null ? 15 : 12);

      if (lat != null && lng != null) {
        markerRef.current = L.marker([lat, lng], { icon: createLocationMarkerIcon(L) }).addTo(map);
      }

      if (!readOnly) {
        map.on("click", (e) => {
          const { lat: clickLat, lng: clickLng } = e.latlng as LatLng;
          if (markerRef.current) {
            markerRef.current.setLatLng([clickLat, clickLng]);
          } else {
            markerRef.current = L.marker([clickLat, clickLng], { icon: createLocationMarkerIcon(L) }).addTo(map);
          }
          onChangeRef.current(
            parseFloat(clickLat.toFixed(6)),
            parseFloat(clickLng.toFixed(6))
          );
        });
      }

      requestAnimationFrame(() => {
        if (!destroyed && mapRef.current) {
          mapRef.current.invalidateSize({ animate: false });
        }
      });
    }

    init();

    return () => {
      destroyed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
      tileRef.current = null;
    };
  }, [readOnly]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (lat != null && lng != null) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        import("leaflet").then((L) => {
          if (!mapRef.current) return;
          markerRef.current = L.marker([lat, lng], { icon: createLocationMarkerIcon(L) }).addTo(mapRef.current);
        });
      }
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [lat, lng]);

  useEffect(() => {
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

    if (mapRef.current && tileRef.current) {
      swap();
    }

    return () => {
      cancelled = true;
    };
  }, [tileKey]);

  async function searchAddress() {
    if (!search.trim() || readOnly) return;
    setSearching(true);
    setGeoError("");
    try {
      const result = await searchNominatim(search);
      if (!result) {
        setGeoError("Dirección no encontrada.");
        return;
      }

      const latNum = result.lat;
      const lngNum = result.lng;
      const map = mapRef.current;
      if (!map) return;

      const L = await import("leaflet");
      map.flyTo([latNum, lngNum], 16, { duration: 1.2 });

      if (markerRef.current) {
        markerRef.current.setLatLng([latNum, lngNum]);
      } else {
        markerRef.current = L.marker([latNum, lngNum], { icon: createLocationMarkerIcon(L) }).addTo(map);
      }

      onChangeRef.current(
        parseFloat(latNum.toFixed(6)),
        parseFloat(lngNum.toFixed(6))
      );
    } catch {
      setGeoError("Error buscando dirección.");
    } finally {
      setSearching(false);
    }
  }

  async function goToMyLocation() {
    if (readOnly) return;
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no soporta geolocalización.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const map = mapRef.current;
        if (!map) return;

        const L = await import("leaflet");
        map.flyTo([latitude, longitude], 16, { duration: 1.2 });

        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        } else {
          markerRef.current = L.marker([latitude, longitude], { icon: createLocationMarkerIcon(L) }).addTo(map);
        }

        onChangeRef.current(
          parseFloat(latitude.toFixed(6)),
          parseFloat(longitude.toFixed(6))
        );
      },
      () => setGeoError("No se pudo obtener tu ubicación."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {!readOnly && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar dirección en el mapa..."
              aria-label="Buscar dirección en el mapa"
              onSubmit={searchAddress}
              autoComplete="street-address"
            />
            <button
              type="button"
              onClick={searchAddress}
              disabled={searching || !search.trim()}
              className="map-toolbar-btn bg-[#1A1510] text-[#F7F4EF] hover:bg-[#4A6E47] disabled:opacity-50"
            >
              <LoadingLabel loading={searching} loadingText="Buscando…" spinnerSize="xs">
                Ir
              </LoadingLabel>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={tileKey}
              onChange={(e) => setTileKey(e.target.value as MapTileKey)}
              className="map-toolbar-select"
              aria-label="Tipo de mapa"
            >
              <option value="street">Calles</option>
              <option value="satellite">Satélite</option>
            </select>
            <button
              type="button"
              onClick={goToMyLocation}
              className="map-toolbar-btn border border-[#C9B99A] bg-[#F7F4EF] text-[#1A1510] hover:bg-[#E8DCC4]"
            >
              Mi posición
            </button>
          </div>
        </div>
      )}

      {!readOnly && (
        <p className="text-xs text-[#9E8F7B]">
          Toca el mapa para marcar el punto de acceso a la propiedad.
        </p>
      )}

      {geoError && <p className="text-xs text-[#B54A35]">{geoError}</p>}

      <div
        ref={containerRef}
        className={`w-full ${heightClass} rounded-lg border border-[#E8DCC4] overflow-hidden relative z-0`}
      />
    </div>
  );
}
