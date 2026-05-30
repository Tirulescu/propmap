"use client";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full rounded border px-3 py-2 text-sm hover:bg-gray-100"
    >
      Cerrar sesión
    </button>
  );
}
