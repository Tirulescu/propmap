import { db } from "@/lib/db";
import { properties, propertyShares, projections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function SharePage({ params }: { params: { token: string } }) {
  const [share] = await db
    .select()
    .from(propertyShares)
    .where(eq(propertyShares.token, params.token));

  if (!share) notFound();
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) notFound();

  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, share.propertyId));

  if (!property) notFound();

  const projectionsList = await db
    .select()
    .from(projections)
    .where(eq(projections.propertyId, property.id));

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <div className="border rounded p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{property.name}</h1>
          <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded">{property.type} (Compartido)</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div><strong>Dirección:</strong> {property.address || "—"}</div>
          <div><strong>Catastro:</strong> {property.catastroRef || "—"}</div>
          {property.catastroUrl && (
            <div className="col-span-2">
              <a href={property.catastroUrl} target="_blank" className="text-blue-600 underline">Ver ficha catastral</a>
            </div>
          )}
        </div>

        {property.type === "MONTE" && (
          <div className="border rounded p-4 bg-gray-50 mb-4 text-sm">
            <h3 className="font-semibold mb-2">Monte</h3>
            <div>Plantado: {property.plantedDate ? new Date(property.plantedDate).toLocaleDateString() : "—"}</div>
            <div>Especie: {property.species || "—"}</div>
            <div>Última tala: {property.lastHarvestDate ? new Date(property.lastHarvestDate).toLocaleDateString() : "—"}</div>
            <div>Ganancia: {property.lastHarvestProfit ? `€${property.lastHarvestProfit}` : "—"}</div>
          </div>
        )}

        {(property.type === "PISO" || property.type === "CASA") && (
          <div className="border rounded p-4 bg-gray-50 mb-4 text-sm">
            <h3 className="font-semibold mb-2">Alquiler</h3>
            <div>Precio: {property.rentalPrice ? `€${property.rentalPrice}/mes` : "—"}</div>
            <div>Inquilino: {property.tenantName || "—"}</div>
            <div>Contrato: {property.leaseStart ? new Date(property.leaseStart).toLocaleDateString() : "—"} — {property.leaseEnd ? new Date(property.leaseEnd).toLocaleDateString() : "—"}</div>
          </div>
        )}

        {projectionsList.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Finanzas</h3>
            <div className="border rounded overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2">Concepto</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Mes</th>
                    <th className="px-3 py-2 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {projectionsList.map((p) => (
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

        {property.notes && <p className="mt-4 text-gray-700">{property.notes}</p>}
      </div>
    </div>
  );
}
