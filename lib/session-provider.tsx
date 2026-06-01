"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { translateAuthError } from "@/lib/auth-errors";
import type { SessionUser } from "@/lib/auth-user";

type Ctx = {
  user: SessionUser | null;
  signInEmail: (e: string, p: string) => Promise<{ error?: string; verifyRequired?: boolean }>;
  signUpEmail: (e: string, p: string, n?: string) => Promise<{ error?: string; verifyRequired?: boolean }>;
  signInGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const C = createContext<Ctx | null>(null);

async function readJson(res: Response) {
  return (await res.json().catch(() => null)) as Record<string, unknown> | null;
}

export function SessionProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: SessionUser | null;
}) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(initialUser ?? null);

  useEffect(() => {
    setUser(initialUser ?? null);
  }, [initialUser]);

  const signInEmail = async (email: string, password: string) => {
    const res = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await readJson(res);

    if (!res.ok) {
      return { error: typeof body?.error === "string" ? body.error : "Error al iniciar sesión." };
    }

    setUser((body?.user as SessionUser | undefined) ?? null);
    router.refresh();
    return {};
  };

  const signUpEmail = async (email: string, password: string, name?: string) => {
    const res = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const body = await readJson(res);

    if (!res.ok) {
      return { error: typeof body?.error === "string" ? body.error : "Error al crear la cuenta." };
    }

    if (body?.verifyRequired) {
      return { verifyRequired: true };
    }

    setUser((body?.user as SessionUser | undefined) ?? null);
    router.refresh();
    return {};
  };

  const signInGoogle = async () => {
    try {
      const redirectTo = `${window.location.origin}/api/auth/callback`;
      const res = await fetch("/api/auth/oauth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redirectTo }),
      });
      const body = await readJson(res);

      if (!res.ok || typeof body?.authUrl !== "string") {
        return {
          error: translateAuthError(
            (typeof body?.error === "string" && body.error) ||
              "No se pudo iniciar el login con Google."
          ),
        };
      }

      window.location.href = body.authUrl;
      return {};
    } catch {
      return {
        error: "No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.",
      };
    }
  };

  const signOut = async () => {
    setUser(null);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } catch {
      // Limpiar estado local aunque falle la petición
    }
    router.refresh();
    router.replace("/login");
  };

  return (
    <C.Provider value={{ user, signInEmail, signUpEmail, signInGoogle, signOut }}>
      {children}
    </C.Provider>
  );
}

export function useSession() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useSession must be inside SessionProvider");
  return ctx;
}
