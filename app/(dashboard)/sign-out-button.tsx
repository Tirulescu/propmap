"use client";

import { useState } from "react";
import { useSession } from "@/lib/session-provider";
import { LoadingLabel } from "@/app/components/loading-label";

export function SignOutButton() {
  const { signOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={signingOut}
      className="sidebar-sign-out disabled:opacity-60"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14H6" />
        <path d="M10 11l3-3-3-3M13 8H6" />
      </svg>
      <LoadingLabel loading={signingOut} loadingText="Cerrando…" spinnerSize="xs">
        Cerrar sesión
      </LoadingLabel>
    </button>
  );
}
