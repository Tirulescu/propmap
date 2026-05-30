"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel imagen / patrón */}
      <div className="hidden lg:flex relative overflow-hidden bg-[#4A6E47]">
        <div className="absolute inset-0 opacity-[0.12]">
          {/* Patrón de ondas orgánico vía SVG */}
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
            Cartografía
            <br />
            <span className="italic">de tierras.</span>
          </h1>
          <p className="mt-6 text-[#E8DCC4] text-lg max-w-md leading-relaxed">
            Registra montes, fincas, pisos y prados. Dibuja sus límites sobre el mapa, lleva las finanzas
            de cada parcela y comparte el legado con quien tú elijas.
          </p>
        </div>
      </div>

      {/* Panel formulario */}
      <div className="flex items-center justify-center p-8 lg:p-0">
        <div className="max-w-sm w-full space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <svg width="48" height="48" viewBox="0 0 100 100" className="mb-6">
                <circle cx="50" cy="50" r="46" stroke="#4A6E47" strokeWidth="2" fill="none"/>
                <circle cx="50" cy="38" r="12" fill="#4A6E47"/>
                <path d="M50 54 L50 82" stroke="#4A6E47" strokeWidth="2"/>
                <path d="M38 70 L50 58 L62 70" stroke="#4A6E47" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <h2 className="text-3xl font-medium tracking-tight">
              Accede a tu
              <br />
              <span className="italic">PropMap</span>
            </h2>
            <p className="mt-2 text-[#6B5E4E]">Continúa con tu cuenta de Google.</p>
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full group rounded border border-[#C9B99A] bg-[#F7F4EF] px-5 py-3
                       text-[#1A1510] hover:border-[#4A6E47] hover:shadow-sm
                       transition-all duration-200 flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M17.6 9.2c0-.7-.1-1.4-.2-2H9v3.7h4.8c-.2 1.3-.9 2.4-2 3.1v2.6h3.2c1.9-1.8 3-4.4 3-7.4z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.7 0 4.9-.9 6.6-2.4l-3.2-2.6c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H.3v2.7C2 15.9 5.2 18 9 18z"
                fill="#34A853"
              />
            </svg>
            <span className="font-medium">Google</span>
          </button>

          <p className="text-center text-xs text-[#9E8F7B]">
            Al continuar aceptas los términos de uso y la política de privacidad.
          </p>
        </div>
      </div>
    </div>
  );
}
