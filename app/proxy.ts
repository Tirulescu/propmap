/**
 * IMPORTANT: Next.js 16 replaces middleware.ts with proxy.ts.
 * Reads the insforge_access_token cookie to gate routes.
 */
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/verify",
  "/api/auth",
  "/share",
  "/_next",
  "/static",
  "/favicon.ico",
];

function isPublic(path: string) {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

function decodePayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (isPublic(path)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("insforge_access_token")?.value;
  const payload = token ? decodePayload(token) : null;

  if (!payload?.sub) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Inject user-id header for server components / API routes
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", payload.sub);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}
