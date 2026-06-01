import { NextRequest, NextResponse } from "next/server";
import { generateCodeChallenge, generateCodeVerifier } from "@/lib/oauth-pkce";
import { INSFORGE_ANON_KEY, INSFORGE_URL, OAUTH_PKCE_COOKIE } from "@/lib/auth-config";

export async function POST(req: NextRequest) {
  if (!INSFORGE_ANON_KEY) {
    return NextResponse.json(
      { error: "Configuración de autenticación incompleta." },
      { status: 500 }
    );
  }

  let redirectTo: string;
  try {
    const body = (await req.json()) as { redirectTo?: string };
    redirectTo = body.redirectTo?.trim() ?? "";
  } catch {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 });
  }

  if (!redirectTo) {
    return NextResponse.json({ error: "Falta la URL de retorno." }, { status: 400 });
  }

  try {
    const redirectOrigin = new URL(redirectTo).origin;
    const requestOrigin = req.headers.get("origin");
    const host = req.headers.get("host");

    if (requestOrigin) {
      if (requestOrigin !== redirectOrigin) {
        return NextResponse.json({ error: "URL de retorno no válida." }, { status: 400 });
      }
    } else if (host && new URL(redirectTo).host !== host) {
      return NextResponse.json({ error: "URL de retorno no válida." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "URL de retorno no válida." }, { status: 400 });
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const url = new URL(`${INSFORGE_URL}/api/auth/oauth/google`);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("redirect_uri", redirectTo);

  const upstream = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${INSFORGE_ANON_KEY}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const body = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    const message =
      body && typeof body.message === "string"
        ? body.message
        : "No se pudo iniciar el login con Google.";
    return NextResponse.json({ error: message }, { status: upstream.status });
  }

  const authUrl = body?.authUrl;
  if (!authUrl || typeof authUrl !== "string") {
    return NextResponse.json(
      { error: "No se recibió la URL de Google." },
      { status: 502 }
    );
  }

  const response = NextResponse.json({ authUrl });
  response.cookies.set({
    name: OAUTH_PKCE_COOKIE,
    value: codeVerifier,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
