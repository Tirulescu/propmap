"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { insforge } from "@/lib/insforge-client";

type SessionUser = {
  id: string;
  email: string;
  name?: string;
  image?: string;
};

type SessionCtx = {
  user: SessionUser | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpEmail: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signInGoogle: (idToken: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshSession() {
    const { data } = await insforge.auth.getCurrentUser();
    if (data?.user) {
      const u = data.user;
      setUser({
        id: u.id,
        email: u.email,
        name: (u as any).profile?.name || u.email,
        image: (u as any).profile?.avatar_url,
      });
    } else {
      setUser(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    refreshSession();
  }, []);

  async function signInEmail(email: string, password: string) {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message || "Credenciales inválidas" };
    if (data) await refreshSession();
    return {};
  }

  async function signUpEmail(email: string, password: string, name?: string) {
    const { data, error } = await insforge.auth.signUp({ email, password, name });
    if (error) return { error: error.message || "Error al registrarse" };
    if (data?.requireEmailVerification) {
      return { error: "VERIFY_REQUIRED" };
    }
    if (data) await refreshSession();
    return {};
  }

  async function signInGoogle(idToken: string) {
    const { data, error } = await insforge.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });
    if (error) return { error: error.message || "Error con Google" };
    if (data) {
      await refreshSession();
      try {
        const token = (insforge as any).auth?.tokenManager?.getToken?.() ||
                      (insforge as any)._token;
        if (token) {
          await fetch("/api/auth/set-cookie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
        }
      } catch {}
    }
    return {};
  }

  async function signOutUser() {
    await insforge.auth.signOut();
    setUser(null);
  }

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        signInEmail,
        signUpEmail,
        signInGoogle,
        signOut: signOutUser,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be inside SessionProvider");
  return ctx;
}
