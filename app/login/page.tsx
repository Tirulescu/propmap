"use client";

import { useState } from "react";
import { useSession } from "@/lib/session-provider";
import GoogleSignInButton from "@/lib/google-signin";

export default function LoginPage() {
  const { signInEmail, signUpEmail, signInGoogle } = useSession();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setVerifyMsg(false);
    setLoading(true);

    if (mode === "login") {
      const res = await signInEmail(email, password);
      if (res.error) setError(res.error);
    } else {
      const res = await signUpEmail(email, password, name || undefined);
      if (res.error === "VERIFY_REQUIRED") setVerifyMsg(true);
      else if (res.error) setError(res.error);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative overflow-hidden bg-[#4A6E47]">
        <div className="absolute inset-0 opacity-[0.12]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="waves" patternUnits="userSpaceOnUse" width="60" height="12">
                <path d="M0 6 Q15 0 30 6 T60 6" stroke="#F7F4EF" strokeWidth="1" fill="none"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#waves)"/>
          </svg>
        </div>
        <div className="relative z-10 flex flex-col justify-end p-12">
          <h1 className="text-[4rem] leading-[0.95] text-[#F7F4EF]">
            Cartografía<br/><span className="italic">de tierras.</span>
          </h1>
          <p className="mt-6 text-[#E8DCC4] text-lg max-w-md leading-relaxed">
            Registra montes, fincas, pisos y prados. Dibuja sus límites, lleva las finanzas
            y comparte el legado con quien tú elijas.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 lg:p-0">
        <div className="max-w-sm w-full space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-medium tracking-tight">
              {mode === "login" ? "Accede a tu" : "Crea tu"}<br/><span className="italic">PropMap</span>
            </h2>
            <p className="mt-2 text-[#6B5E4E]">
              {mode === "login" ? "Email y contraseña, o Google." : "Comienza con tu email."}
            </p>
          </div>

          {verifyMsg && (
            <div className="rounded-md bg-[#4A6E47]/10 text-[#4A6E47] px-4 py-3 text-sm">
              Revisa tu email para verificar la cuenta.
            </div>
          )}
          {error && (
            <div className="rounded-md bg-[#B54A35]/10 text-[#B54A35] px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-[#6B5E4E] mb-1">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded border border-[#C9B99A] bg-[#F7F4EF] px-3 py-2 text-[#1A1510] focus:border-[#4A6E47] focus:outline-none"
                  placeholder="Tu nombre"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#6B5E4E] mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-[#C9B99A] bg-[#F7F4EF] px-3 py-2 text-[#1A1510] focus:border-[#4A6E47] focus:outline-none"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B5E4E] mb-1">Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-[#C9B99A] bg-[#F7F4EF] px-3 py-2 text-[#1A1510] focus:border-[#4A6E47] focus:outline-none"
                placeholder="••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-[#1A1510] text-[#F7F4EF] px-5 py-2.5 hover:bg-[#4A6E47] transition-colors disabled:opacity-50"
            >
              {loading ? "Cargando…" : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#C9B99A]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#F7F4EF] px-2 text-[#9E8F7B]">o</span>
            </div>
          </div>

          <GoogleSignInButton
            text={mode === "login" ? "signin_with" : "signup_with"}
            onToken={(token) => signInGoogle(token)}
          />

          <p className="text-center text-sm text-[#6B5E4E]">
            {mode === "login" ? (
              <>
                ¿Sin cuenta?{" "}
                <button type="button" onClick={() => setMode("signup")} className="underline text-[#4A6E47]">
                  Crear cuenta
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{" "}
                <button type="button" onClick={() => setMode("login")} className="underline text-[#4A6E47]">
                  Entrar
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
