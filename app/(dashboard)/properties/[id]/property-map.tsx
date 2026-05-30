"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map, Polygon } from "leaflet";

interface PropertyMapProps {
  lat: number;
  lng: number;
  geoPolygon?: any;
  propertyId: string;
}

export default function PropertyMap({ lat, lng, geoPolygon, propertyId }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<Map | null>(null);
  const polygonRef = useRef<Polygon | null>(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    async function init() {
      const L = await import("leaflet");

      const map = L.map(mapRef.current!).setView([lat, lng], 14);
      leafletMap.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      L.marker([lat, lng]).addTo(map);

      if (geoPolygon) {
        const geo = L.geoJSON(geoPolygon).addTo(map);
        map.fitBounds(geo.getBounds());
      }
    }

    init();

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, [lat, lng, geoPolygon]);

  async function startDraw() {
    setDrawing(true);
    const L = await import("leaflet");
    const map = leafletMap.current!;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const polygon: [number, number][] = [];
    let tempPolygon: Polygon | null = null;

    map.on("click", (e) => {
      polygon.push([e.latlng.lat, e.latlng.lng]);
      L.circleMarker(e.latlng, { radius: 4 }).addTo(drawnItems);

      if (tempPolygon) {
        drawnItems.removeLayer(tempPolygon);
      }
      if (polygon.length > 2) {
        tempPolygon = L.polygon(polygon, { color: "blue", fillOpacity: 0.2 }).addTo(drawnItems);
      }
    });

    function finish() {
      if (polygon.length > 2) {
        const geojson = {
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [[...polygon, polygon[0]]] },
        };
        savePolygon(geojson);
        setDrawing(false);
      }
    }

    // @ts-ignore – leaflet control API typing mismatch
    const btn = (L as any).control({ position: "topright" });
    btn.onAdd = () => {
      const el = L.DomUtil.create("button", "leaflet-bar leaflet-control");
      el.innerHTML = "✓ Guardar área";
      el.style.padding = "4px 8px";
      el.style.cursor = "pointer";
      el.onclick = finish;
      return el;
    };
    btn.addTo(map);
  }

  async function savePolygon(geojson: any) {
    await fetch(`/api/properties/${propertyId}/polygon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ polygon: geojson }),
    });
    alert("Área guardada");
  }

  return (
    <div>
      <div className="flex gap-2 mb-2">
        {!drawing ? (
          <button onClick={startDraw} className="rounded bg-[#4A6E47] px-3 py-1 text-white text-sm">
            Dibujar área
          </button>
        ) : (
          <p className="text-sm text-gray-600">Haz clic en el mapa para dibujar. Cierra el polígono pulsando "Guardar área".</p>
        )}
      </div>
      <div ref={mapRef} className="w-full h-[400px] rounded border" />
    </div>
  );
}
