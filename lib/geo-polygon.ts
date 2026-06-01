import type { Feature, Geometry, GeoJsonObject, Polygon } from "geojson";

export type SavedPolygonFeature = Feature<Polygon, { id?: string }>;

/** GeoJSON: [lng, lat]. Corrige pares [lat, lng] en el rango peninsular español. */
function isLikelyLatLngPair(a: number, b: number): boolean {
  return a >= 35 && a <= 46 && b >= -12 && b <= 5;
}

function swapRing(ring: number[][]): number[][] {
  return ring.map((c) => (c.length >= 2 ? [c[1], c[0], ...c.slice(2)] : c));
}

function fixGeometryCoords(geometry: Geometry): Geometry {
  if (geometry.type === "Polygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((ring) =>
        ring.length > 0 && isLikelyLatLngPair(ring[0][0], ring[0][1])
          ? swapRing(ring)
          : ring
      ),
    };
  }
  if (geometry.type === "MultiPolygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((poly) =>
        poly.map((ring) =>
          ring.length > 0 && isLikelyLatLngPair(ring[0][0], ring[0][1])
            ? swapRing(ring)
            : ring
        )
      ),
    };
  }
  return geometry;
}

export function normalizeGeoPolygon(raw: unknown): GeoJsonObject | null {
  if (raw == null || raw === "") return null;

  let data: unknown = raw;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }

  if (typeof data !== "object" || data === null) return null;

  const obj = data as Record<string, unknown>;
  if (obj.type === "Feature" && obj.geometry && typeof obj.geometry === "object") {
    return {
      ...obj,
      geometry: fixGeometryCoords(obj.geometry as Geometry),
    } as unknown as GeoJsonObject;
  }

  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
    const features = obj.features
      .filter(
        (f): f is Record<string, unknown> =>
          typeof f === "object" &&
          f !== null &&
          (f as { type?: string }).type === "Feature" &&
          typeof (f as { geometry?: unknown }).geometry === "object"
      )
      .map((f) => ({
        ...f,
        geometry: fixGeometryCoords((f as { geometry: Geometry }).geometry),
      }));
    return { type: "FeatureCollection", features } as unknown as GeoJsonObject;
  }

  if (
    obj.type === "Polygon" ||
    obj.type === "MultiPolygon" ||
    obj.type === "Point" ||
    obj.type === "LineString"
  ) {
    return {
      type: "Feature",
      properties: {},
      geometry: fixGeometryCoords(obj as unknown as Geometry),
    } as GeoJsonObject;
  }

  return obj as unknown as GeoJsonObject;
}

function ringCentroid(ring: number[][]): { lat: number; lng: number } | null {
  if (ring.length < 3) return null;
  let sumLat = 0;
  let sumLng = 0;
  let count = 0;
  for (const c of ring) {
    if (c.length < 2) continue;
    sumLng += c[0];
    sumLat += c[1];
    count++;
  }
  if (count === 0) return null;
  return { lat: sumLat / count, lng: sumLng / count };
}

/** Extrae polígonos guardados (soporta Feature, FeatureCollection o MultiPolygon legacy). */
export function parseGeoPolygonFeatures(raw: unknown): SavedPolygonFeature[] {
  const normalized = normalizeGeoPolygon(raw);
  if (!normalized || typeof normalized !== "object") return [];

  const obj = normalized as unknown as Record<string, unknown>;

  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
    return obj.features
      .filter(
        (f): f is SavedPolygonFeature =>
          typeof f === "object" &&
          f !== null &&
          (f as { geometry?: { type?: string } }).geometry?.type === "Polygon"
      )
      .map((f, i) => ({
        type: "Feature",
        properties: { id: (f.properties as { id?: string })?.id ?? `area-${i + 1}` },
        geometry: (f as SavedPolygonFeature).geometry,
      }));
  }

  if (obj.type === "Feature" && (obj.geometry as Geometry | undefined)?.type === "Polygon") {
    return [
      {
        type: "Feature",
        properties: { id: (obj.properties as { id?: string })?.id ?? "area-1" },
        geometry: obj.geometry as Polygon,
      },
    ];
  }

  if (obj.type === "Feature" && (obj.geometry as Geometry | undefined)?.type === "MultiPolygon") {
    const mp = obj.geometry as Extract<Geometry, { type: "MultiPolygon" }>;
    return mp.coordinates.map((coords, i) => ({
      type: "Feature",
      properties: { id: `area-${i + 1}` },
      geometry: { type: "Polygon", coordinates: coords },
    }));
  }

  return [];
}

/** Serializa polígonos para guardar (1 Feature o FeatureCollection si hay varios). */
export function buildGeoPolygonFromFeatures(
  features: SavedPolygonFeature[]
): GeoJsonObject | null {
  if (features.length === 0) return null;
  if (features.length === 1) return features[0] as unknown as GeoJsonObject;
  return {
    type: "FeatureCollection",
    features,
  } as unknown as GeoJsonObject;
}

/** Centro aproximado de todas las áreas (para lat/lng del formulario). */
export function centroidFromGeoPolygon(raw: unknown): { lat: number; lng: number } | null {
  const features = parseGeoPolygonFeatures(raw);
  if (features.length === 0) return null;

  let sumLat = 0;
  let sumLng = 0;
  let count = 0;

  for (const feature of features) {
    const ring = feature.geometry.coordinates[0];
    const c = ringCentroid(ring);
    if (!c) continue;
    sumLat += c.lat;
    sumLng += c.lng;
    count++;
  }

  if (count === 0) return null;
  return { lat: sumLat / count, lng: sumLng / count };
}
