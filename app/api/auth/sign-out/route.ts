import { clearAuthCookies, createServerClient } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { insforgeSessionOptions } from "@/lib/auth-config";

export async function POST() {
  const client = createServerClient({
    ...insforgeSessionOptions,
    cookies: await cookies(),
  });

  try {
    await client.auth.signOut();
  } catch {
    // Limpiar cookies aunque falle el logout remoto
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response.cookies);
  return response;
}
