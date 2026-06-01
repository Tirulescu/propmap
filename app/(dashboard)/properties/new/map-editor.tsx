"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { LoadingLabel } from "@/app/components/loading-label";
import { SearchInput } from "@/app/components/search-input";
import {
  MAP_TILE_LAYERS,
  PROPERTY_POLYGON_STYLE,
  type MapTileKey,
} from "@/lib/map-constants";
import {
  buildGeoPolygonFromFeatures,
  centroidFromGeoPolygon,
  parseGeoPolygonFeatures,
  type SavedPolygonFeature,
} from "@/lib/geo-polygon";
import { searchNominatim } from "@/lib/nominatim";
import type { Map, LatLng, LayerGroup, CircleMarker, Polyline, Polygon, TileLayer } from "leaflet";

interface MapEditorProps {
  lat: number;
  lng: number;
  geoPolygon?: unknown;
  onChange?: (geojson: unknown | null) => void;
  onPositionChange?: (lat: number, lng: number) => void;
}

function nextAreaId(areas: SavedPolygonFeature[]): string {
  const used = new Set(areas.map((a) => a.properties?.id).filter(Boolean));
  let n = areas.length + 1;
  while (used.has(`area-${n}`)) n++;
  return `area-${n}`;
}

export default function MapEditor({ lat, lng, geoPolygon, onChange, onPositionChange }: MapEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const savedLayerRef = useRef<LayerGroup | null>(null);
  const drawLayerRef = useRef<LayerGroup | null>(null);
  const tileRef = useRef<TileLayer | null>(null);
  const pointsRef = useRef<LatLng[]>([]);
  const markersRef = useRef<CircleMarker[]>([]);
  const polylineRef = useRef<Polyline | null>(null);
  const polygonRef = useRef<Polygon | null>(null);

  const [areas, setAreas] = useState<SavedPolygonFeature[]>(() =>
    parseGeoPolygonFeatures(geoPolygon)
  );
  const [drawing, setDrawing] = useState(false);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [pointCount, setPointCount] = useState(0);
  const [geoError, setGeoError] = useState("");
  const [tileKey, setTileKey] = useState<MapTileKey>("satellite");
  const skipTileSwapRef = useRef(true);
  const skipParentSyncRef = useRef(true);
  const onChangeRef = useRef(onChange);
  const onPositionChangeRef = useRef(onPositionChange);
  onChangeRef.current = onChange;
  onPositionChangeRef.current = onPositionChange;

  useEffect(() => {
    if (skipParentSyncRef.current) {
      skipParentSyncRef.current = false;
      return;
    }
    const geo = buildGeoPolygonFromFeatures(areas);
    onChangeRef.current?.(geo);
    const center = centroidFromGeoPolygon(geo);
    if (center) onPositionChangeRef.current?.(center.lat, center.lng);
  }, [areas]);

  const renderSavedAreas = useCallback(async () => {
    const L = await import("leaflet");
    const layer = savedLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const feature of areas) {
      try {
        L.geoJSON(feature, { style: PROPERTY_POLYGON_STYLE }).addTo(layer);
      } catch {
        // GeoJSON inválido en un área: se omite.
      }
    }
  }, [areas]);

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

      savedLayerRef.current = L.layerGroup().addTo(map);
      drawLayerRef.current = L.layerGroup().addTo(map);
      map.setView([lat, lng], 15);

      const initial = parseGeoPolygonFeatures(geoPolygon);
      if (initial.length > 0 && savedLayerRef.current) {
        try {
          const geo = buildGeoPolygonFromFeatures(initial);
          if (geo) {
            const rendered = L.geoJSON(geo, { style: PROPERTY_POLYGON_STYLE }).addTo(
              savedLayerRef.current
            );
            const bounds = rendered.getBounds();
            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [20, 20] });
            }
          }
        } catch {
          // Sin áreas válidas al cargar.
        }
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
      skipTileSwapRef.current = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      tileRef.current = null;
      savedLayerRef.current = null;
      drawLayerRef.current = null;
    };
  }, [lat, lng]);

  useEffect(() => {
    void renderSavedAreas();
    const map = mapRef.current;
    if (!map || areas.length === 0) return;

    import("leaflet").then((L) => {
      const geo = buildGeoPolygonFromFeatures(areas);
      if (!geo || !savedLayerRef.current) return;
      try {
        const rendered = L.geoJSON(geo, { style: PROPERTY_POLYGON_STYLE });
        const bounds = rendered.getBounds();
        if (bounds.isValid() && !drawing) {
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch {
        // Ignorar bounds inválidos.
      }
    });
  }, [areas, renderSavedAreas, drawing]);

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

  const onMapClick = useCallback(async (e: { latlng: LatLng }) => {
    if (!drawing) return;
    const L = await import("leaflet");
    const latlng = e.latlng;

    pointsRef.current.push(latlng);

    const marker = L.circleMarker(latlng, {
      radius: 5,
      color: "#B54A35",
      fillColor: "#B54A35",
      fillOpacity: 1,
      weight: 2,
    }).addTo(drawLayerRef.current!);
    markersRef.current.push(marker);

    const icon = L.divIcon({
      className: "map-point-label",
      html: `<span style="background:#1A1510;color:#F7F4EF;border-radius:999px;padding:1px 5px;font-size:11px;font-family:sans-serif;">${pointsRef.current.length}</span>`,
      iconSize: [20, 16],
      iconAnchor: [10, -8],
    });
    L.marker(latlng, { icon, interactive: false }).addTo(drawLayerRef.current!);

    updateDrawShape(L);
    setPointCount(pointsRef.current.length);
    setGeoError("");
  }, [drawing]);

  async function updateDrawShape(L: typeof import("leaflet")) {
    const drawLayer = drawLayerRef.current!;
    const pts = pointsRef.current;

    if (polylineRef.current) {
      drawLayer.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
    if (polygonRef.current) {
      drawLayer.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }

    if (pts.length >= 2) {
      if (pts.length >= 3 && pts[0].equals(pts[pts.length - 1])) {
        polygonRef.current = L.polygon(pts, {
          color: "#B54A35",
          weight: 2,
          fillColor: "#B54A35",
          fillOpacity: 0.3,
          dashArray: undefined,
        }).addTo(drawLayer);
      } else {
        polylineRef.current = L.polyline(pts, {
          color: "#B54A35",
          weight: 2,
          dashArray: "6,6",
        }).addTo(drawLayer);
      }
    }
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (drawing) {
      map.getContainer().style.cursor = "crosshair";
      map.on("click", onMapClick);
    } else {
      map.getContainer().style.cursor = "";
      map.off("click", onMapClick);
    }
    return () => {
      map.off("click", onMapClick);
    };
  }, [drawing, onMapClick]);

  function clearDraw() {
    pointsRef.current = [];
    markersRef.current = [];
    drawLayerRef.current?.clearLayers();
    polylineRef.current = null;
    polygonRef.current = null;
    setPointCount(0);
    setGeoError("");
  }

  function startDrawing() {
    clearDraw();
    setDrawing(true);
    setPointCount(0);
  }

  function cancelDrawing() {
    setDrawing(false);
    clearDraw();
  }

  function removeArea(index: number) {
    setAreas((prev) => prev.filter((_, i) => i !== index));
    setGeoError("");
  }

  async function undoPoint() {
    if (pointsRef.current.length === 0) return;
    pointsRef.current.pop();
    await refreshDrawLayer();
    setPointCount(pointsRef.current.length);
  }

  async function refreshDrawLayer() {
    const L = await import("leaflet");
    const drawLayer = drawLayerRef.current!;
    drawLayer.clearLayers();
    markersRef.current = [];
    pointsRef.current.forEach((latlng, i) => {
      const marker = L.circleMarker(latlng, {
        radius: 5,
        color: "#B54A35",
        fillColor: "#B54A35",
        fillOpacity: 1,
        weight: 2,
      }).addTo(drawLayer);
      markersRef.current.push(marker);
      const icon = L.divIcon({
        className: "map-point-label",
        html: `<span style="background:#1A1510;color:#F7F4EF;border-radius:999px;padding:1px 5px;font-size:11px;font-family:sans-serif;">${i + 1}</span>`,
        iconSize: [20, 16],
        iconAnchor: [10, -8],
      });
      L.marker(latlng, { icon, interactive: false }).addTo(drawLayer);
    });
    updateDrawShape(L);
  }

  function pointsToFeature(pts: LatLng[]): SavedPolygonFeature | null {
    if (pts.length < 3) return null;
    const coords: [number, number][] = pts.map((p) => [p.lng, p.lat]);
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) coords.push(coords[0]);
    return {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [coords] },
    };
  }

  function closePolygon() {
    if (pointsRef.current.length < 3) {
      setGeoError("Necesitas al menos 3 puntos para cerrar el área.");
      return;
    }
    pointsRef.current.push(pointsRef.current[0]);
    void refreshDrawLayer();
    setGeoError("");
  }

  async function savePolygon() {
    const pts = pointsRef.current;
    if (pts.length < 3) {
      setGeoError("Dibuja al menos 3 puntos antes de guardar.");
      return;
    }
    if (!pts[0].equals(pts[pts.length - 1])) {
      pts.push(pts[0]);
      await refreshDrawLayer();
    }

    const feature = pointsToFeature(pts);
    if (!feature) return;

    setAreas((prev) => [
      ...prev,
      { ...feature, properties: { id: nextAreaId(prev) } },
    ]);

    setDrawing(false);
    clearDraw();
    setGeoError("Área guardada.");
    setTimeout(() => setGeoError(""), 3000);
  }

  async function goToMyLocation(e?: React.MouseEvent<HTMLButtonElement>) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
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
        const blueIcon = L.divIcon({
          className: "current-pos-marker",
          html: `<div style="width:14px;height:14px;background:#4285F4;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        L.marker([latitude, longitude], { icon: blueIcon, zIndexOffset: 1000 }).addTo(
          drawLayerRef.current!
        );
      },
      () => setGeoError("No se pudo obtener tu ubicación. Revisa los permisos."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function searchAddress() {
    if (!search.trim()) return;
    setSearching(true);
    setGeoError("");
    try {
      const result = await searchNominatim(search);
      if (!result) {
        setGeoError("Dirección no encontrada.");
        return;
      }
      const map = mapRef.current;
      if (!map) return;
      const L = await import("leaflet");
      const latNum = result.lat;
      const lngNum = result.lng;
      map.flyTo([latNum, lngNum], 16, { duration: 1.2 });
      L.circleMarker([latNum, lngNum], {
        radius: 8,
        color: "#4A6E47",
        fillColor: "#4A6E47",
        fillOpacity: 0.3,
        weight: 2,
      })
        .addTo(drawLayerRef.current!)
        .bindPopup(result.displayName)
        .openPopup();
    } catch {
      setGeoError("Error buscando dirección.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar dirección..."
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
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <select
            value={tileKey}
            onChange={(e) => setTileKey(e.target.value as MapTileKey)}
            className="map-toolbar-select"
            aria-label="Tipo de mapa"
          >
            {(Object.keys(MAP_TILE_LAYERS) as MapTileKey[]).map((key) => (
              <option key={key} value={key}>
                {MAP_TILE_LAYERS[key].label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={goToMyLocation}
            className="map-toolbar-btn gap-1.5 border border-[#C9B99A] bg-[#F7F4EF] text-[#1A1510] hover:bg-[#E8DCC4]"
            title="Mi ubicación"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
            Mi posición
          </button>
          {!drawing ? (
            <button
              type="button"
              onClick={startDrawing}
              className="map-toolbar-btn bg-[#4A6E47] text-white hover:bg-[#3a5a37]"
            >
              {areas.length > 0 ? "Añadir área" : "Dibujar área"}
            </button>
          ) : (
            <button
              type="button"
              onClick={cancelDrawing}
              className="map-toolbar-btn bg-[#B54A35] text-white hover:bg-[#9a3d2b]"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {areas.length > 0 && !drawing && (
        <ul className="flex flex-col gap-2 animate-fade-in">
          {areas.map((area, index) => (
            <li
              key={area.properties?.id ?? index}
              className="flex items-center justify-between gap-2 rounded-md border border-[#E8DCC4] bg-[#F7F4EF]/60 px-3 py-2 text-sm text-[#1A1510]"
            >
              <span>Área {index + 1}</span>
              <button
                type="button"
                onClick={() => removeArea(index)}
                className="rounded border border-[#B54A35]/40 px-2 py-0.5 text-xs text-[#B54A35] hover:bg-[#B54A35]/10"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      {geoError && (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            geoError.includes("guardada")
              ? "bg-[#4A6E47]/10 text-[#4A6E47]"
              : "bg-[#B54A35]/10 text-[#B54A35]"
          }`}
        >
          {geoError}
        </div>
      )}

      {drawing && (
        <div className="flex flex-wrap gap-2 items-center animate-fade-in">
          <span className="text-sm text-[#6B5E4E]">
            {pointCount === 0
              ? "Haz clic en el mapa para marcar puntos."
              : pointCount < 3
                ? `${pointCount} punto${pointCount > 1 ? "s" : ""} — mínimo 3.`
                : `${pointCount} puntos — clic en el primero o pulsa Cerrar.`}
          </span>
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={undoPoint}
              disabled={pointCount === 0}
              className="rounded border border-[#C9B99A] px-2 py-1 text-xs text-[#6B5E4E] hover:bg-[#E8DCC4] disabled:opacity-40"
            >
              Deshacer
            </button>
            <button
              type="button"
              onClick={closePolygon}
              disabled={pointCount < 3}
              className="rounded border border-[#C9B99A] px-2 py-1 text-xs text-[#6B5E4E] hover:bg-[#E8DCC4] disabled:opacity-40"
            >
              Cerrar área
            </button>
            <button
              type="button"
              onClick={savePolygon}
              disabled={pointCount < 3}
              className="rounded bg-[#4A6E47] px-2 py-1 text-xs text-white hover:bg-[#3a5a37] disabled:opacity-50"
            >
              Guardar área
            </button>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full h-[320px] sm:h-[420px] rounded-lg border border-[#E8DCC4] overflow-hidden relative"
      />
    </div>
  );
}
