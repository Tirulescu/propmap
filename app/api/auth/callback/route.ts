import { createServerClient, setAuthCookies } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { OAUTH_PKCE_COOKIE, insforgeSessionOptions } from "@/lib/auth-config";
import { translateAuthError } from "@/lib/auth-errors";
import { redirectTo } from "@/lib/request-origin";

export async function GET(req: NextRequest) {
  const error = req.nextUrl.searchParams.get("error");
  if (error) {
    return redirectTo(req, "/login", { error });
  }

  const code = req.nextUrl.searchParams.get("insforge_code");
  if (!code) {
    return redirectTo(req, "/login", {
      error: translateAuthError("no_session"),
    });
  }

  const verifier = req.cookies.get(OAUTH_PKCE_COOKIE)?.value;
  if (!verifier) {
    return redirectTo(req, "/login", {
      error: translateAuthError("PKCE_VERIFIER_MISSING"),
    });
  }

  const client = createServerClient({
    ...insforgeSessionOptions,
    cookies: await cookies(),
  });

  const { data, error: exchangeError } = await client.auth.exchangeOAuthCode(code, verifier);

  if (exchangeError || !data?.accessToken || !data.user) {
    const response = redirectTo(req, "/login", {
      error: translateAuthError(exchangeError || "no_session"),
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

  const response = redirectTo(req, "/properties");
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
