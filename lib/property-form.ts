/** Campos comunes de propiedad extraídos de FormData (crear / editar). */
export function parsePropertyFormData(formData: FormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    type: formData.get("type") as string,
    name: formData.get("name") as string,
    address: (formData.get("address") as string) || null,
    location_lat: formData.get("locationLat")
      ? parseFloat(formData.get("locationLat") as string)
      : null,
    location_lng: formData.get("locationLng")
      ? parseFloat(formData.get("locationLng") as string)
      : null,
    catastro_ref: (formData.get("catastroRef") as string) || null,
    catastro_url: (formData.get("catastroUrl") as string) || null,
    planted_date: formData.get("plantedDate")
      ? new Date(formData.get("plantedDate") as string).toISOString()
      : null,
    species: (formData.get("species") as string) || null,
    last_harvest_date: formData.get("lastHarvestDate")
      ? new Date(formData.get("lastHarvestDate") as string).toISOString()
      : null,
    rental_price: formData.get("rentalPrice") ? String(formData.get("rentalPrice")) : null,
    tenant_name: (formData.get("tenantName") as string) || null,
    tenant_email: (formData.get("tenantEmail") as string) || null,
    tenant_phone: (formData.get("tenantPhone") as string) || null,
    lease_start: formData.get("leaseStart")
      ? new Date(formData.get("leaseStart") as string).toISOString()
      : null,
    lease_end: formData.get("leaseEnd")
      ? new Date(formData.get("leaseEnd") as string).toISOString()
      : null,
    notes: (formData.get("notes") as string) || null,
  };

  const polygonRaw = formData.get("geoPolygon") as string;
  if (polygonRaw === "null" || polygonRaw === "") {
    payload.geo_polygon = null;
  } else if (polygonRaw) {
    try {
      payload.geo_polygon = JSON.parse(polygonRaw);
    } catch {
      // GeoJSON inválido: se omite.
    }
  }

  return payload;
}
