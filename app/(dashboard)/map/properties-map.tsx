"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DbProperty } from "@/lib/db/types";
import { hasSavedLocation } from "@/lib/maps-url";
import { createPropertyTypeMarkerIcon } from "@/lib/leaflet-marker";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, SATELLITE_TILE_LAYER } from "@/lib/map-constants";
import { filterPropertiesByQueryAndTypes } from "@/lib/property-filters";
import { PROPERTY_TYPE_EMOJI, PROPERTY_TYPE_LABEL } from "@/lib/property-types";
import PropertyTypeFilter from "@/app/components/property-type-filter";
import { SearchInput } from "@/app/components/search-input";
import {
  destroyAllPopupMiniMaps,
  destroyPopupMiniMap,
  mountPopupMiniMap,
  popupPreviewId,
} from "@/lib/popup-mini-map";

interface Props {
  properties: DbProperty[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function buildPopupHtml(property: DbProperty): string {
  const name = escapeHtml(property.name);
  const typeLabel = escapeHtml(PROPERTY_TYPE_LABEL[property.type] ?? property.type);
  const emoji = PROPERTY_TYPE_EMOJI[property.type] ?? "📍";
  const detailUrl = `/properties/${encodeURIComponent(property.id)}`;
  const previewId = popupPreviewId(property.id);
  const catastroUrl = normalizeText(property.catastro_url);
  const catastroHtml = catastroUrl
    ? `<div class="property-map-popup__catastro">
        <span class="property-map-popup__label">Catastro</span>
        <a href="${escapeHtml(catastroUrl)}" target="_blank" rel="noopener noreferrer" class="property-map-popup__link">Ir al catastro</a>
      </div>`
    : "";

  return `
    <div class="property-map-popup__inner">
      <a href="#close" class="property-map-popup__close" aria-label="Cerrar">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true">
          <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
        </svg>
      </a>
      <div class="property-map-popup__main">
        <div class="property-map-popup__header">
          <p class="property-map-popup__name">${name}</p>
          <span class="property-map-popup__type">${emoji} ${typeLabel}</span>
        </div>
        ${catastroHtml}
        <a href="${detailUrl}" class="property-map-popup__cta">Ver ficha completa</a>
      </div>
      <div
        class="property-map-popup__preview"
        id="${previewId}"
        aria-label="Vista satélite del área"
      ></div>
    </div>
  `;
}

export default function PropertiesMap({ properties }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").LayerGroup | null>(null);
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<DbProperty["type"][]>([]);
  const [mapReady, setMapReady] = useState(false);

  const locatedProperties = useMemo(
    () =>
      properties.filter(
        (p): p is DbProperty & { location_lat: number; location_lng: number } =>
          hasSavedLocation(p.location_lat, p.location_lng)
      ),
    [properties]
  );

  const filteredProperties = useMemo(() => {
    const filtered = filterPropertiesByQueryAndTypes(locatedProperties, query, selectedTypes);
    const ids = new Set(filtered.map((p) => p.id));
    return locatedProperties.filter((p) => ids.has(p.id));
  }, [locatedProperties, query, selectedTypes]);

  const hasTypeFilter = selectedTypes.length > 0;
  const hasActiveFilters = Boolean(query.trim()) || hasTypeFilter;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || locatedProperties.length === 0) return;

    let destroyed = false;
    let resizeObserver: ResizeObserver | null = null;

    async function init() {
      const L = await import("leaflet");
      if (destroyed || !containerRef.current) return;

      const map = L.map(containerRef.current, { zoomControl: false });
      mapRef.current = map;

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer(SATELLITE_TILE_LAYER.url, {
        attribution: SATELLITE_TILE_LAYER.attribution,
        maxZoom: 19,
      }).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);

      map.setView([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng], DEFAULT_MAP_ZOOM);
      setMapReady(true);

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
      setMapReady(false);
      resizeObserver?.disconnect();
      markersRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [locatedProperties.length]);

  useEffect(() => {
    if (!mapReady) return;

    let cancelled = false;

    async function updateMarkers() {
      const L = await import("leaflet");
      if (cancelled) return;

      const map = mapRef.current;
      const layer = markersRef.current;
      if (!map || !layer) return;

      layer.clearLayers();
      destroyAllPopupMiniMaps();

      const bounds = L.latLngBounds([]);

      for (const property of filteredProperties) {
        const { location_lat: lat, location_lng: lng } = property;
        if (!hasSavedLocation(lat, lng)) continue;

        const marker = L.marker([lat, lng], {
          icon: createPropertyTypeMarkerIcon(L, property.type),
        });

        const popupMaxWidth =
          typeof window !== "undefined"
            ? Math.min(320, window.innerWidth - 32)
            : 320;

        marker.bindPopup(buildPopupHtml(property), {
          className: "property-map-popup",
          maxWidth: popupMaxWidth,
        });

        marker.on("popupopen", () => {
          const container = document.getElementById(popupPreviewId(property.id));
          if (container) void mountPopupMiniMap(container, property);
        });

        marker.on("popupclose", () => {
          destroyPopupMiniMap(property.id);
        });

        marker.addTo(layer);
        bounds.extend([lat, lng]);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
      } else if (locatedProperties.length > 0) {
        const allBounds = L.latLngBounds([]);
        for (const property of locatedProperties) {
          allBounds.extend([property.location_lat, property.location_lng]);
        }
        if (allBounds.isValid()) {
          map.fitBounds(allBounds, { padding: [48, 48], maxZoom: 12 });
        }
      }
    }

    updateMarkers();

    return () => {
      cancelled = true;
    };
  }, [mapReady, filteredProperties, locatedProperties]);

  return (
    <div className="flex min-w-0 max-w-full flex-1 flex-col min-h-0 gap-4 animate-fade-in">
      <header className="relative z-[1000] shrink-0 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="min-w-0 font-display text-xl font-medium tracking-tight sm:text-2xl">
            Mapa
          </h1>
          <Link
            href="/properties"
            className="map-list-link shrink-0 no-underline"
            aria-label="Ver listado de propiedades"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M2 4h12M2 8h12M2 12h12" />
            </svg>
            <span className="hidden sm:inline">Ver listado</span>
            <span className="sm:hidden">Listado</span>
          </Link>
        </div>

        {locatedProperties.length > 0 && (
          <div className="flex items-center gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar en el mapa..."
            />

            <PropertyTypeFilter
              selectedTypes={selectedTypes}
              onSelectedTypesChange={setSelectedTypes}
              popoverClassName="z-[1001]"
            />
          </div>
        )}

        {locatedProperties.length > 0 && hasActiveFilters && (
          <p className="text-xs text-[#9E8F7B]">
            {filteredProperties.length === 0
              ? "Ninguna propiedad coincide con los filtros."
              : `${filteredProperties.length} de ${locatedProperties.length} ${
                  filteredProperties.length === 1 ? "visible" : "visibles"
                } en el mapa`}
          </p>
        )}
      </header>

      {locatedProperties.length === 0 ? (
        <div className="card flex flex-1 min-h-[320px] flex-col items-center justify-center p-10 text-center">
          <div className="mb-4 text-4xl" aria-hidden="true">
            🗺️
          </div>
          <p className="text-[#6B5E4E] mb-2">No hay propiedades para mostrar en el mapa.</p>
          <p className="text-sm text-[#9E8F7B] mb-5">
            Edita una propiedad y añade su ubicación para verla aquí.
          </p>
          <Link href="/properties" className="btn-primary no-underline">
            Ir a mis propiedades
          </Link>
        </div>
      ) : (
        <div className="relative z-0 flex-1 min-h-0 min-w-0 max-w-full overflow-hidden">
          <div
            ref={containerRef}
            className="absolute inset-0 max-w-full rounded-lg border border-[#E8DCC4] overflow-hidden"
            aria-label="Mapa de propiedades"
          />
          {filteredProperties.length === 0 && (
            <div className="pointer-events-none absolute inset-x-4 top-4 z-[1000]">
              <div className="mx-auto max-w-md rounded-lg border border-[#E8DCC4] bg-[#F7F4EF]/95 px-4 py-3 text-center text-sm text-[#6B5E4E] shadow-[0_8px_24px_rgba(26,21,16,0.1)] backdrop-blur-sm">
                Ajusta la búsqueda o los tipos para ver marcadores.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
