import type { Metadata, Viewport } from "next";
import { Playfair_Display, Crimson_Pro } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/insforge-server";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${playfair.variable} ${crimson.variable} antialiased`}
    >
      <body className="min-h-dvh w-full max-w-full overflow-x-clip">
        <SessionProvider initialUser={session?.user ?? null}>{children}</SessionProvider>
      </body>
    </html>
  );
}
