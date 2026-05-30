"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { insforge } from "@/lib/insforge-client";

export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: err } = await insforge.auth.verifyEmail({ email, otp });
    if (err || !data) {
      setError(err?.message || "Código inválido");
    } else {
      router.push("/login");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F4EF] text-[#1A1510]">
      <div className="max-w-sm w-full space-y-6 p-8">
        <h2 className="text-2xl font-medium">Verifica tu email</h2>
        <p className="text-[#6B5E4E]">Introduce el código de 6 dígitos que recibiste.</p>

        {error && (
          <div className="rounded-md bg-[#B54A35]/10 text-[#B54A35] px-4 py-3 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#6B5E4E] mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-[#C9B99A] bg-[#F7F4EF] px-3 py-2 text-[#1A1510] focus:border-[#4A6E47] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B5E4E] mb-1">Código</label>
            <input
              type="text"
              required
              maxLength={6}
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded border border-[#C9B99A] bg-[#F7F4EF] px-3 py-2 text-[#1A1510] focus:border-[#4A6E47] focus:outline-none tracking-[0.5em]"
              placeholder="123456"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-[#1A1510] text-[#F7F4EF] px-5 py-2.5 hover:bg-[#4A6E47] transition-colors disabled:opacity-50"
          >
            {loading ? "Verificando…" : "Verificar"}
          </button>
        </form>
      </div>
    </div>
  );
}
