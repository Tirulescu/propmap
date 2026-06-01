"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { translateAuthError } from "@/lib/auth-errors";
import { LoadingLabel } from "@/app/components/loading-label";

function VerifyForm() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const presetEmail = searchParams.get("email");
    if (presetEmail) setEmail(presetEmail);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setError(body?.error || translateAuthError("Código inválido"));
        return;
      }

      router.push("/properties");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F4EF] text-[#1A1510] px-4">
      <div className="card p-6 sm:p-8 w-full max-w-sm animate-fade-in">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🔐</div>
          <h2 className="font-display font-medium tracking-tight">Verifica tu email</h2>
          <p className="text-[#6B5E4E] text-sm mt-1">Introduce el código de 6 dígitos que recibiste.</p>
        </div>

        {error && (
          <div className="rounded-lg bg-[#B54A35]/10 text-[#B54A35] px-4 py-3 text-sm mb-4 animate-fade-in">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Código</label>
            <input
              type="text"
              required
              maxLength={6}
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="tracking-[0.5em] text-center"
              placeholder="123456"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#1A1510] text-[#F7F4EF] px-5 py-2.5 hover:bg-[#4A6E47] transition-colors disabled:opacity-50 font-medium"
          >
            <LoadingLabel loading={loading} loadingText="Verificando…">
              Verificar
            </LoadingLabel>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  );
}
