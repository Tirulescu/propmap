import { createServerClient, setAuthCookies } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { OAUTH_PKCE_COOKIE, insforgeSessionOptions } from "@/lib/auth-config";
import { translateAuthError } from "@/lib/auth-errors";

export async function GET(req: NextRequest) {
  const error = req.nextUrl.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, req.url)
    );
  }

  const code = req.nextUrl.searchParams.get("insforge_code");
  if (!code) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(translateAuthError("no_session"))}`,
        req.url
      )
    );
  }

  const verifier = req.cookies.get(OAUTH_PKCE_COOKIE)?.value;
  if (!verifier) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(translateAuthError("PKCE_VERIFIER_MISSING"))}`,
        req.url
      )
    );
  }

  const client = createServerClient({
    ...insforgeSessionOptions,
    cookies: await cookies(),
  });

  const { data, error: exchangeError } = await client.auth.exchangeOAuthCode(code, verifier);

  if (exchangeError || !data?.accessToken || !data.user) {
    const response = NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(translateAuthError(exchangeError || "no_session"))}`,
        req.url
      )
    );
    response.cookies.set({
      name: OAUTH_PKCE_COOKIE,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  const response = NextResponse.redirect(new URL("/properties", req.url));
  setAuthCookies(response.cookies, {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? null,
  });
  response.cookies.set({
    name: OAUTH_PKCE_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
