import { getDatabase, type DatabaseClient } from "@/lib/insforge-server";
import type { DbProperty, DbProjection, DbPropertyHistory } from "@/lib/db/types";

export type ShareRole = "VIEWER" | "EDITOR";
export type PropertyRole = "OWNER" | ShareRole;

export type PropertyAccess = {
  role: PropertyRole;
  isOwner: boolean;
  canView: boolean;
  canEdit: boolean;
  canManageShares: boolean;
};

export type PropertyListItem = DbProperty & {
  accessRole: PropertyRole;
};

/** Columnas para listados (sin geo_polygon ni images). */
export const PROPERTY_LIST_SELECT =
  "id,owner_id,type,name,address,location_lat,location_lng,catastro_ref,catastro_url,registry_sheet,planted_date,species,last_harvest_date,last_harvest_profit,rental_price,tenant_name,tenant_email,tenant_phone,lease_start,lease_end,notes,created_at,updated_at";

/** Columnas para ficha / edición (incluye mapa y fotos legacy). */
export const PROPERTY_DETAIL_SELECT = `${PROPERTY_LIST_SELECT},geo_polygon,images`;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function resolvePropertyAccess(
  ownerId: string,
  userId: string,
  share: { role: string } | null | undefined
): PropertyAccess | null {
  if (ownerId === userId) {
    return {
      role: "OWNER",
      isOwner: true,
      canView: true,
      canEdit: true,
      canManageShares: true,
    };
  }

  if (!share) return null;

  const role = share.role as ShareRole;
  return {
    role,
    isOwner: false,
    canView: true,
    canEdit: role === "EDITOR",
    canManageShares: false,
  };
}

async function fetchShareForUser(
  db: DatabaseClient,
  propertyId: string,
  userEmail: string
) {
  const email = normalizeEmail(userEmail);
  const { data } = await db
    .from("property_shares")
    .select("role")
    .eq("property_id", propertyId)
    .eq("shared_with_email", email)
    .maybeSingle();
  return data;
}

export async function getPropertyAccess(
  propertyId: string,
  userId: string,
  userEmail: string,
  db?: DatabaseClient
): Promise<PropertyAccess | null> {
  const database = db ?? (await getDatabase());
  const { data: property } = await database
    .from("properties")
    .select("owner_id")
    .eq("id", propertyId)
    .maybeSingle();

  if (!property) return null;

  if (property.owner_id === userId) {
    return resolvePropertyAccess(property.owner_id, userId, null);
  }

  const share = await fetchShareForUser(database, propertyId, userEmail);
  return resolvePropertyAccess(property.owner_id, userId, share);
}

export type LoadPropertyBundleOptions = {
  includeProjections?: boolean;
  includeHistory?: boolean;
  requireEdit?: boolean;
};

export type PropertyDetailBundle = {
  property: DbProperty;
  access: PropertyAccess;
  projections: DbProjection[];
  history: DbPropertyHistory[];
};

/**
 * Carga propiedad + permisos (+ proyecciones/historial opcionales) en un solo round-trip paralelo.
 */
export async function loadPropertyBundle(
  propertyId: string,
  userId: string,
  userEmail: string,
  options: LoadPropertyBundleOptions = {},
  db?: DatabaseClient
): Promise<PropertyDetailBundle | null> {
  const {
    includeProjections = true,
    includeHistory = true,
    requireEdit = false,
  } = options;

  const database = db ?? (await getDatabase());

  const propertyPromise = database
    .from("properties")
    .select(PROPERTY_DETAIL_SELECT)
    .eq("id", propertyId)
    .maybeSingle();

  const sharePromise = fetchShareForUser(database, propertyId, userEmail);

  const projectionsPromise = includeProjections
    ? database
        .from("projections")
        .select("*")
        .eq("property_id", propertyId)
        .order("year", { ascending: true })
        .order("month", { ascending: true })
    : null;

  const historyPromise = includeHistory
    ? database
        .from("property_history")
        .select("*")
        .eq("property_id", propertyId)
        .order("event_date", { ascending: false })
    : null;

  const [propertyResult, share, projectionsResult, historyResult] = await Promise.all([
    propertyPromise,
    sharePromise,
    projectionsPromise ?? Promise.resolve(null),
    historyPromise ?? Promise.resolve(null),
  ]);

  const property = propertyResult.data;
  if (!property) return null;

  const access = resolvePropertyAccess(property.owner_id, userId, share);
  if (!access?.canView) return null;
  if (requireEdit && !access.canEdit) return null;

  return {
    property: property as DbProperty,
    access,
    projections:
      projectionsResult && !projectionsResult.error
        ? (projectionsResult.data ?? [])
        : [],
    history:
      historyResult && !historyResult.error ? (historyResult.data ?? []) : [],
  };
}

async function getOwnedProperties(
  userId: string,
  select: string,
  db: DatabaseClient
): Promise<DbProperty[]> {
  const { data } = await db
    .from("properties")
    .select(select)
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as DbProperty[];
}

async function getSharedProperties(
  userEmail: string,
  select: string,
  db: DatabaseClient
): Promise<Array<{ property: DbProperty; accessRole: ShareRole }>> {
  const email = normalizeEmail(userEmail);
  const { data: shares } = await db
    .from("property_shares")
    .select("property_id, role")
    .eq("shared_with_email", email);

  if (!shares?.length) return [];

  const propertyIds = shares.map((s) => s.property_id);
  const { data: properties } = await db
    .from("properties")
    .select(select)
    .in("id", propertyIds);

  const list = (properties ?? []) as unknown as DbProperty[];
  if (!list.length) return [];

  const roleByPropertyId = new Map(
    shares.map((s) => [s.property_id, s.role as ShareRole])
  );

  return list.map((property) => ({
    property,
    accessRole: roleByPropertyId.get(property.id) ?? "VIEWER",
  }));
}

export type AccessiblePropertiesOptions = {
  /** Incluye geo_polygon (vista mapa). */
  forMap?: boolean;
};

export async function getAllAccessibleProperties(
  userId: string,
  userEmail: string,
  options?: AccessiblePropertiesOptions,
  db?: DatabaseClient
): Promise<PropertyListItem[]> {
  const select = options?.forMap
    ? `${PROPERTY_LIST_SELECT},geo_polygon`
    : PROPERTY_LIST_SELECT;

  const database = db ?? (await getDatabase());

  const [owned, shared] = await Promise.all([
    getOwnedProperties(userId, select, database),
    getSharedProperties(userEmail, select, database),
  ]);

  const ownedItems: PropertyListItem[] = owned.map((p) => ({
    ...p,
    accessRole: "OWNER",
  }));

  const sharedItems: PropertyListItem[] = shared
    .map(({ property, accessRole }) => ({
      ...property,
      accessRole,
    }))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const merged = [...ownedItems, ...sharedItems];
  const seen = new Set<string>();
  const result: PropertyListItem[] = [];

  for (const item of merged) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }

  return result;
}
