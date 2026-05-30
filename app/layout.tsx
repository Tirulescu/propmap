import type { Metadata } from "next";
import { Playfair_Display, Crimson_Pro } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const crimson = Crimson_Pro({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "PropMap · Cartografía de Propiedades",
  description: "Gestiona montes, fincas, pisos y prados con mapa y finanzas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${playfair.variable} ${crimson.variable} antialiased`}
    >
      <body className="min-h-screen bg-[#F7F4EF] text-[#1A1510]">
        {children}
      </body>
    </html>
  );
}
