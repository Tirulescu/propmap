"use client";

import { useSession } from "@/lib/session-provider";

export function SignOutButton() {
  const { signOut } = useSession();

  return (
    <button
      onClick={() => signOut()}
      className="w-full rounded border border-[#C9B99A] bg-transparent px-3 py-2 text-sm text-[#6B5E4E] hover:bg-[#E8DCC4] transition-colors"
    >
      Cerrar sesión
    </button>
  );
}
