export type PropertyType = "MONTE" | "PRADO" | "CASA" | "PISO" | "TERRENO" | "FINCA";

export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
  created_at: string;
}

export interface DbProperty {
  id: string;
  owner_id: string;
  type: PropertyType;
  name: string;
  address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  geo_polygon: any | null;
  catastro_ref: string | null;
  catastro_url: string | null;
  registry_sheet: string | null;
  planted_date: string | null;
  species: string | null;
  last_harvest_date: string | null;
  last_harvest_profit: string | null;
  rental_price: string | null;
  tenant_name: string | null;
  tenant_email: string | null;
  tenant_phone: string | null;
  lease_start: string | null;
  lease_end: string | null;
  notes: string | null;
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface DbProjection {
  id: string;
  property_id: string;
  year: number;
  month: number | null;
  type: string;
  category: string;
  amount: string;
  description: string | null;
  created_at: string;
}

export interface DbDocument {
  id: string;
  property_id: string;
  name: string;
  url: string;
  type: string | null;
  created_at: string;
}

export interface DbPropertyShare {
  id: string;
  property_id: string;
  shared_by_id: string;
  token: string;
  role: string;
  expires_at: string | null;
  created_at: string;
}
