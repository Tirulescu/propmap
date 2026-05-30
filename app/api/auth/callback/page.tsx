"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { insforge } from "@/lib/insforge-client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // SDK detecta y guarda sesión en memoria + localStorage.
    // Además enviamos al servidor para que cree la cookie httpOnly.
    setTimeout(async () => {
      const { data } = await insforge.auth.getCurrentUser();
      if (data?.user) {
        // Intentar obtener token del manager del SDK
        const token = (insforge as any).auth?.tokenManager?.getToken?.() ||
                      (insforge as any)._token;
        if (token) {
          await fetch("/api/auth/set-cookie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
        }
        router.push("/properties");
      } else {
        router.push("/login");
      }
    }, 600);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-[#1A1510]">
      <p className="text-lg">Conectando con tu cuenta…</p>
    </div>
  );
}
