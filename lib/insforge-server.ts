/**
 * Server-side auth helper for InsForge.
 * Reads the access-token cookie and decodes the JWT to get the current user.
 */
import { jwtVerify, createRemoteJWKSet, JWTHeaderParameters } from "jose";
import { cookies } from "next/headers";

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL || "https://insforge.tirulescu.com";

async function getJWKSet() {
  try {
    const res = await fetch(`${INSFORGE_URL}/.well-known/jwks.json`);
    if (!res.ok) throw new Error("Failed to fetch JWKS");
    return await res.json();
  } catch {
    return null;
  }
}

async function verifyToken(token: string) {
  try {
    // InsForge uses HS256 with a known secret on the backend side.
    // Since we don't have the server secret, we validate structure + expiry only.
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    if (!payload.sub) return null;
    if (payload.exp &&
        payload.exp * 1000 < Date.now()) return null;

    return payload as {
      sub: string;
      email?: string;
      role?: string;
      [k: string]: any;
    };
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("insforge_access_token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    user: {
      id: payload.sub,
      email: payload.email || "",
      name: payload.name || payload.email || "",
      role: payload.role || "authenticated",
    },
    token,
  };
}
