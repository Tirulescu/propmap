import { getSession } from "@/lib/insforge-server";
import { insforge } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function PropertiesPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const { data: list, error } = await insforge.database
    .from('properties')
    .select('*')
    .eq('owner_id', userId);

  if (error) {
    console.error("Error fetching properties:", error);
    throw new Error(error.message);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Mis Propiedades</h1>
        <a href="/properties/new" className="rounded bg-[#1A1510] px-3 py-2 text-[#F7F4EF] hover:bg-[#4A6E47] transition-colors">+ Nueva</a>
      </div>

      {!list || list.length === 0 ? (
        <p className="text-[#6B5E4E]">No tienes propiedades registradas.</p>
      ) : (
        <div className="grid gap-4">
          {list.map((p) => (
            <a key={p.id} href={`/properties/${p.id}`} className="rounded border p-4 hover:shadow">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-[#6B5E4E]">{p.type} · {p.address || "Sin dirección"}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
