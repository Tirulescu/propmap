import { getSession } from "@/lib/insforge-server";
import { SignOutButton } from "./sign-out-button";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen flex bg-[#F7F4EF]">
      <aside className="w-60 border-r border-[#E8DCC4] p-5 flex flex-col gap-6 bg-[#F7F4EF]">
        <div className="font-[family-name:var(--font-display)] text-2xl font-500 tracking-tight text-[#1A1510]">
          PropMap
        </div>

        <nav className="flex flex-col gap-1">
          <a href="/properties" className="rounded px-3 py-2 text-sm text-[#6B5E4E] hover:bg-[#E8DCC4] hover:text-[#1A1510] transition-colors">
            Mis Propiedades
          </a>
          <a href="/properties/new" className="rounded px-3 py-2 text-sm text-[#6B5E4E] hover:bg-[#E8DCC4] hover:text-[#1A1510] transition-colors">
            + Nueva
          </a>
        </nav>

        <div className="mt-auto pt-6 border-t border-[#E8DCC4]">
          <p className="text-sm text-[#6B5E4E] mb-3 truncate">{session.user.name}</p>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 p-8 max-w-5xl">{children}</main>
    </div>
  );
}
