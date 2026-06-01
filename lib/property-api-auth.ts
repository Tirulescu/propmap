import {
  getAuthContext,
  type AuthSession,
  type DatabaseClient,
  type InsforgeServerClient,
} from "@/lib/insforge-server";
import { getPropertyAccess, type PropertyAccess } from "@/lib/property-access";

export type PropertyAuthResult =
  | { ok: false; response: Response }
  | {
      ok: true;
      session: AuthSession;
      access: PropertyAccess;
      db: DatabaseClient;
      client: InsforgeServerClient;
    };

export type PropertyAccessMode = "view" | "edit" | "manageShares" | "owner";

export async function requirePropertyAccess(
  propertyId: string,
  mode: PropertyAccessMode
): Promise<PropertyAuthResult> {
  const ctx = await getAuthContext();
  if (!ctx) {
    return { ok: false, response: new Response("Unauthorized", { status: 401 }) };
  }

  const session: AuthSession = { user: ctx.user, token: ctx.token };
  const db = ctx.client.database;

  const access = await getPropertyAccess(
    propertyId,
    ctx.user.id,
    ctx.user.email,
    db
  );

  if (!access) {
    return { ok: false, response: new Response("Forbidden", { status: 403 }) };
  }

  const forbidden = () => ({
    ok: false as const,
    response: new Response("Forbidden", { status: 403 }),
  });

  if (mode === "view" && !access.canView) return forbidden();
  if (mode === "edit" && !access.canEdit) return forbidden();
  if (mode === "manageShares" && !access.canManageShares) return forbidden();
  if (mode === "owner" && !access.isOwner) return forbidden();

  return {
    ok: true,
    session,
    access,
    db,
    client: ctx.client,
  };
}
