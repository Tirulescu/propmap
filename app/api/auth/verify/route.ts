import { createServerClient, setAuthCookies } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { insforgeSessionOptions } from "@/lib/auth-config";
import { mapInsforgeUser } from "@/lib/auth-user";
import { translateAuthError } from "@/lib/auth-errors";

export async function POST(req: NextRequest) {
  let email = "";
  let otp = "";

  try {
    const body = (await req.json()) as { email?: string; otp?: string };
    email = body.email?.trim() ?? "";
    otp = body.otp?.trim() ?? "";
  } catch {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 });
  }

  if (!email || !otp) {
    return NextResponse.json({ error: "Email y código son obligatorios." }, { status: 400 });
  }

  const client = createServerClient({
    ...insforgeSessionOptions,
    cookies: await cookies(),
  });

  const { data, error } = await client.auth.verifyEmail({ email, otp });

  if (error || !data?.accessToken || !data.user) {
    return NextResponse.json(
      { error: translateAuthError(error || "Código inválido") },
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
