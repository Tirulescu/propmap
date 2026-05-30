"use client";

import { useState } from "react";
import { useSession } from "@/lib/session-provider";

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

          <button
            type="button"
            onClick={async () => {
              setError("");
              setLoading(true);
              const res = await signInGoogle();
              if (res.error) setError(res.error);
              setLoading(false);
            }}
            disabled={loading}
            className="w-full rounded border border-[#C9B99A] bg-white text-[#1A1510] px-5 py-2.5 hover:bg-[#F7F4EF] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar con Google
          </button>

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
