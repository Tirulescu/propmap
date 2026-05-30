/**
 * Server-side auth helper for InsForge.
 * Reads the access-token cookie and decodes the JWT to get the current user.
 */
import { cookies } from "next/headers";

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL || "https://insforge.tirulescu.com";

async function verifyToken(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    if (!payload.sub) return null;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;

    return payload as {
      sub: string;
      email?: string;
      name?: string;
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
