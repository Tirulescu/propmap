export function hasSavedLocation(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  return lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);
}

export function getDirectionsUrl(options: {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
}): string | null {
  const { lat, lng, address } = options;

  if (hasSavedLocation(lat, lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}&travelmode=driving`;
  }

  if (address?.trim()) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}&travelmode=driving`;
  }

  return null;
}
