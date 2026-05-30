/**
 * IMPORTANT: Next.js 16 replaces middleware.ts with proxy.ts.
 * This file must live at the root of the app/ directory and act as the first
 * gate for every incoming request.
 *
 * Keep this file LIGHT — only JWT token decode + rewrite logic.
 * Do NOT import drizzle-orm or pg here. Edge runtime cannot load Node modules.
 */
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/share",
  "/_next",
  "/static",
  "/favicon.ico",
];

function isPublic(path: string) {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (isPublic(path)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
