import { getSession } from "@/lib/insforge-server";
import { db } from "@/lib/db";
import { properties } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function PropertiesPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const list = await db
    .select()
    .from(properties)
    .where(eq(properties.ownerId, userId));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Mis Propiedades</h1>
        <a href="/properties/new" className="rounded bg-blue-600 px-3 py-2 text-white">+ Nueva</a>
      </div>

      {list.length === 0 ? (
        <p className="text-gray-500">No tienes propiedades registradas.</p>
      ) : (
        <div className="grid gap-4">
          {list.map((p) => (
            <a key={p.id} href={`/properties/${p.id}`} className="rounded border p-4 hover:shadow">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-gray-500">{p.type} · {p.address || "Sin dirección"}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
