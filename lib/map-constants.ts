export const DEFAULT_MAP_CENTER = { lat: 43.45, lng: -8.17 } as const;
export const DEFAULT_MAP_ZOOM = 8;

export const MAP_TILE_LAYERS = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '© <a href="https://osm.org/copyright">OpenStreetMap</a>',
    label: "Calles",
  },
  satellite: {
    url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    attribution: "Satellite imagery © Google",
    label: "Satélite",
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "Map data: © OpenStreetMap, SRTM | Tiles: © OpenTopoMap",
    label: "Terreno",
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap, © CARTO",
    label: "Claro",
  },
} as const;

export type MapTileKey = keyof typeof MAP_TILE_LAYERS;

export const PROPERTY_POLYGON_STYLE = {
  color: "#B54A35",
  weight: 2,
  fillOpacity: 0.25,
  fillColor: "#B54A35",
} as const;

export const POPUP_POLYGON_STYLE = {
  ...PROPERTY_POLYGON_STYLE,
  fillOpacity: 0.35,
} as const;

export const SATELLITE_TILE_LAYER = MAP_TILE_LAYERS.satellite;
