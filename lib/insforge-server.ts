import { createServerClient } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { mapInsforgeUser, type SessionUser } from "@/lib/auth-user";
import { insforgeSessionOptions } from "@/lib/auth-config";

export type InsforgeServerClient = ReturnType<typeof createServerClient>;

export type AuthContext = {
  client: InsforgeServerClient;
  user: SessionUser;
  token: string;
};

export type AuthSession = {
  user: SessionUser;
  token: string;
};

export type DatabaseClient = InsforgeServerClient["database"];

/** Una sola validación de sesión por petición (React cache). */
const loadAuthContext = cache(async (): Promise<AuthContext | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("insforge_access_token")?.value;
  if (!token) return null;

  const client = createServerClient({
    ...insforgeSessionOptions,
    cookies: cookieStore,
  });

  const { data, error } = await client.auth.getCurrentUser();
  if (error || !data?.user) return null;

  return {
    client,
    user: mapInsforgeUser(data.user),
    token,
  };
});

/** Cliente InsForge con sesión del usuario (JWT en cookies). */
export async function getAuthenticatedClient(): Promise<InsforgeServerClient | null> {
  const ctx = await loadAuthContext();
  return ctx?.client ?? null;
}

/** Sesión del usuario actual. */
export async function getSession(): Promise<AuthSession | null> {
  const ctx = await loadAuthContext();
  if (!ctx) return null;
  return { user: ctx.user, token: ctx.token };
}

/** Acceso a Postgres vía InsForge con RLS del usuario actual. */
export async function getDatabase(): Promise<DatabaseClient> {
  const ctx = await loadAuthContext();
  if (!ctx) throw new Error("No autenticado");
  return ctx.client.database;
}

/** Contexto completo (cliente + usuario) o null. Memoizado por petición. */
export const getAuthContext = loadAuthContext;

/** Contexto completo (cliente + usuario). Lanza si no hay sesión. */
export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await loadAuthContext();
  if (!ctx) throw new Error("No autenticado");
  return ctx;
}
