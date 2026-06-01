"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/session-provider";
import { SignOutButton } from "./sign-out-button";

const navLinks = [
  { href: "/properties", label: "Mis Propiedades" },
  { href: "/map", label: "Mapa" },
] as const;

function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(active: boolean) {
  return `pill-btn w-full justify-start ${active ? "pill-btn-active" : "pill-btn-inactive"}`;
}

function SidebarUserFooter({ user }: { user: NonNullable<ReturnType<typeof useSession>["user"]> }) {
  const displayName = user.name || user.email?.split("@")[0] || "Usuario";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="shrink-0 mt-4 sidebar-user-panel">
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moss/12 font-display text-sm font-medium text-moss"
          aria-hidden="true"
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#1A1510] truncate leading-tight">{displayName}</p>
          {user.email && (
            <p className="text-xs text-[#6B5E4E] truncate mt-0.5">{user.email}</p>
          )}
        </div>
      </div>
      <SignOutButton />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isMapPage = pathname === "/map" || pathname.startsWith("/map/");

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div
      className={`min-h-dvh w-full max-w-full overflow-x-clip bg-[#F7F4EF] md:flex ${
        isMapPage ? "h-dvh overflow-hidden flex flex-col md:flex-row" : ""
      }`}
    >
      {/* ── Mobile header ── */}
      <header className="md:hidden sticky top-0 z-40 bg-[#F7F4EF]/95 backdrop-blur-md border-b border-[#C9B99A]/40 px-4 py-3 flex items-center justify-between">
        <Link
          href="/properties"
          className="font-display text-xl font-medium tracking-tight text-ink no-underline hover:text-ink"
        >
          PropMap
        </Link>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="p-2 rounded-md hover:bg-[#E8DCC4] transition-colors"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#1A1510" strokeWidth="1.8" strokeLinecap="round">
            {menuOpen ? (
              <>
                <path d="M4 4l12 12M16 4L4 16" />
              </>
            ) : (
              <>
                <path d="M2 5h16M2 10h16M2 15h16" />
              </>
            )}
          </svg>
        </button>
      </header>

      {/* ── Mobile slide-out menu ── */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-30">
          <div
            className="absolute inset-0 bg-[#6B5E4E]/25 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            className="absolute top-[56px] right-0 w-64 dashboard-sidebar border-l border-[#C9B99A]/60 shadow-xl h-[calc(100dvh-56px)] flex flex-col p-4 animate-slide-in"
            aria-label="Navegación principal"
          >
            <div className="sidebar-nav flex-1 min-h-0 overflow-y-auto">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isNavActive(pathname, l.href) ? "page" : undefined}
                  className={navLinkClass(isNavActive(pathname, l.href))}
                >
                  {l.label}
                </Link>
              ))}
            </div>
            {user && <SidebarUserFooter user={user} />}
          </nav>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside className="dashboard-sidebar hidden md:flex md:sticky md:top-0 md:h-dvh md:max-h-dvh shrink-0 w-60 flex-col border-r border-[#C9B99A]/60 p-5 overflow-hidden">
        <Link
          href="/properties"
          className="shrink-0 mb-8 font-display text-2xl font-medium tracking-tight text-ink no-underline hover:text-ink"
        >
          PropMap
        </Link>

        <nav className="sidebar-nav flex-1 min-h-0 overflow-y-auto" aria-label="Navegación principal">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isNavActive(pathname, l.href) ? "page" : undefined}
              className={navLinkClass(isNavActive(pathname, l.href))}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {user && <SidebarUserFooter user={user} />}
      </aside>

      {/* ── Main ── */}
      <main
        className={
          isMapPage
            ? "flex w-full flex-1 min-w-0 min-h-0 max-w-full flex-col overflow-x-clip p-4 md:p-5"
            : "w-full flex-1 min-w-0 max-w-full overflow-x-clip p-4 sm:p-6 md:px-8 lg:px-10 md:py-8"
        }
      >
        {children}
      </main>
    </div>
  );
}
