import type { Metadata } from "next";
import { Playfair_Display, Crimson_Pro } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/lib/session-provider";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const crimson = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PropMap · Cartografía de Propiedades",
  description: "Gestiona montes, fincas, pisos y prados con mapa y finanzas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${playfair.variable} ${crimson.variable} antialiased`}>
      <body className="min-h-screen bg-[#F7F4EF] text-[#1A1510]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
