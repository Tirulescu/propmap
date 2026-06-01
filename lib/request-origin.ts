import { NextRequest, NextResponse } from "next/server";

/** Origen público detrás de Traefik/reverse proxy (evita redirects a 0.0.0.0:3000). */
export function getPublicOrigin(req: NextRequest): string {
  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const proto =
      req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
    return `${proto}://${forwardedHost}`;
  }

  const host = req.headers.get("host");
  if (host && !/^0\.0\.0\.0(?::\d+)?$/i.test(host)) {
    const proto = req.nextUrl.protocol.replace(":", "") || "https";
    return `${proto}://${host}`;
  }

  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  if (appUrl) return appUrl;

  return req.nextUrl.origin;
}

export function redirectTo(
  req: NextRequest,
  pathname: string,
  query?: Record<string, string>
): NextResponse {
  const target = new URL(pathname, getPublicOrigin(req));
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      target.searchParams.set(key, value);
    }
  }
  return NextResponse.redirect(target);
}
