import { insforge } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function SharePage({ params }: { params: { token: string } }) {
  const { data: share } = await insforge.database
    .from("property_shares")
    .select("*")
    .eq("token", params.token)
    .maybeSingle();

  if (!share) notFound();
  if (share.expires_at && new Date(share.expires_at) < new Date()) notFound();

  const { data: property } = await insforge.database
    .from("properties")
    .select("*")
    .eq("id", share.property_id)
    .maybeSingle();

  if (!property) notFound();

  const { data: projectionsList } = await insforge.database
    .from("projections")
    .select("*")
    .eq("property_id", property.id);

  const projectionsData = projectionsList || [];

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <div className="border rounded p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{property.name}</h1>
          <span className="text-sm bg-gray-100 text-[#1A1510] px-2 py-1 rounded">{property.type} (Compartido)</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div><strong>Dirección:</strong> {property.address || "—"}</div>
          <div><strong>Catastro:</strong> {property.catastro_ref || "—"}</div>
          {property.catastro_url && (
            <div className="col-span-2">
              <a href={property.catastro_url} target="_blank" className="text-[#4A6E47] underline">Ver ficha catastral</a>
            </div>
          )}
        </div>

        {property.type === "MONTE" && (
          <div className="border rounded p-4 bg-[#E8DCC4]/30 mb-4 text-sm">
            <h3 className="font-semibold mb-2">Monte</h3>
            <div>Plantado: {property.planted_date ? new Date(property.planted_date).toLocaleDateString() : "—"}</div>
            <div>Especie: {property.species || "—"}</div>
            <div>Última tala: {property.last_harvest_date ? new Date(property.last_harvest_date).toLocaleDateString() : "—"}</div>
            <div>Ganancia: {property.last_harvest_profit ? `€${property.last_harvest_profit}` : "—"}</div>
          </div>
        )}

        {(property.type === "PISO" || property.type === "CASA") && (
          <div className="border rounded p-4 bg-[#E8DCC4]/30 mb-4 text-sm">
            <h3 className="font-semibold mb-2">Alquiler</h3>
            <div>Precio: {property.rental_price ? `€${property.rental_price}/mes` : "—"}</div>
            <div>Inquilino: {property.tenant_name || "—"}</div>
            <div>Contrato: {property.lease_start ? new Date(property.lease_start).toLocaleDateString() : "—"} — {property.lease_end ? new Date(property.lease_end).toLocaleDateString() : "—"}</div>
          </div>
        )}

        {projectionsData.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Finanzas</h3>
            <div className="border rounded overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#E8DCC4]/30">
                    <th className="px-3 py-2">Concepto</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Mes</th>
                    <th className="px-3 py-2 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {projectionsData.map((p) => (
                    <tr key={p.id} className={`border-t ${p.type === "INCOME" ? "text-green-700" : "text-red-700"}`}>
                      <td className="px-3 py-2">{p.category}</td>
                      <td className="px-3 py-2">{p.type === "INCOME" ? "Ingreso" : "Gasto"}</td>
                      <td className="px-3 py-2">{p.month}</td>
                      <td className="px-3 py-2 text-right">
                        €{parseFloat(String(p.amount)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {property.notes && <p className="mt-4 text-[#1A1510]">{property.notes}</p>}
      </div>
    </div>
  );
}
