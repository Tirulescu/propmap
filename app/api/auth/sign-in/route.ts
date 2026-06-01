import { createServerClient, setAuthCookies } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { insforgeSessionOptions } from "@/lib/auth-config";
import { mapInsforgeUser } from "@/lib/auth-user";
import { translateAuthError } from "@/lib/auth-errors";

export async function POST(req: NextRequest) {
  let email = "";
  let password = "";

  try {
    const body = (await req.json()) as { email?: string; password?: string };
    email = body.email?.trim() ?? "";
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña son obligatorios." }, { status: 400 });
  }

  const client = createServerClient({
    ...insforgeSessionOptions,
    cookies: await cookies(),
  });

  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error || !data?.accessToken || !data.user) {
    return NextResponse.json(
      { error: translateAuthError(error || "INVALID_CREDENTIALS") },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ user: mapInsforgeUser(data.user) });
  setAuthCookies(response.cookies, {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? null,
  });

  return response;
}
