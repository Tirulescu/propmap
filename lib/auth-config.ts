export const INSFORGE_URL =
  process.env.NEXT_PUBLIC_INSFORGE_URL || "https://insforge.tirulescu.com";
export const INSFORGE_ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || "";

export const insforgeSessionOptions = {
  baseUrl: INSFORGE_URL,
  anonKey: INSFORGE_ANON_KEY,
} as const;

export const OAUTH_PKCE_COOKIE = "insforge_oauth_pkce";
