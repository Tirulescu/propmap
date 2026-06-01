export type NominatimResult = {
  lat: number;
  lng: number;
  displayName: string;
};

export async function searchNominatim(query: string): Promise<NominatimResult | null> {
  const q = encodeURIComponent(query.trim());
  if (!q) return null;

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
    { headers: { "Accept-Language": "es" } }
  );
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const { lat, lon, display_name } = data[0];
  return {
    lat: parseFloat(lat),
    lng: parseFloat(lon),
    displayName: display_name ?? query.trim(),
  };
}
