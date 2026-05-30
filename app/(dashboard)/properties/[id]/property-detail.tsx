"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import PropertyFinance from "./property-finance";

// Dynamically import the map to avoid SSR issues
const PropertyMapDynamic = dynamic(() => import("./property-map"), {
  ssr: false,
  loading: () => <p>Cargando mapa...</p>,
});

export default function PropertyDetail({
  property,
  projections,
  isOwner,
}: {
  property: any;
  projections: any[];
  isOwner: boolean;
}) {
  const [tab, setTab] = useState<"info" | "map" | "finance" | "share">("info");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{property.name}</h1>
        {isOwner && (
          <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
            Propietario
          </span>
        )}
      </div>

      <div className="flex gap-4 border-b mb-6">
        {(["info", "map", "finance", "share"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-2 font-medium ${
              tab === t ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
            }`}
          >
            {t === "info" && "Información"}
            {t === "map" && "Mapa"}
            {t === "finance" && "Finanzas"}
            {t === "share" && "Compartir"}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div><strong>Tipo:</strong> {property.type}</div>
            <div><strong>Dirección:</strong> {property.address || "—"}</div>
          </div>
          <div>
            <strong>Ref. Catastro:</strong> {property.catastroRef || "—"}
            {property.catastroUrl && (
              <a href={property.catastroUrl} target="_blank" className="ml-2 text-blue-600 underline">
                Ver en Catastro
              </a>
            )}
          </div>

          {property.type === "MONTE" && (
            <div className="border rounded p-4 bg-gray-50">
              <h3 className="font-semibold mb-2">Datos del Monte</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Plantado: {property.plantedDate ? new Date(property.plantedDate).toLocaleDateString() : "—"}</div>
                <div>Especie: {property.species || "—"}</div>
                <div>Última tala: {property.lastHarvestDate ? new Date(property.lastHarvestDate).toLocaleDateString() : "—"}</div>
                <div>Ganancia: {property.lastHarvestProfit ? `€${property.lastHarvestProfit}` : "—"}</div>
              </div>
            </div>
          )}

          {(property.type === "PISO" || property.type === "CASA") && (
            <div className="border rounded p-4 bg-gray-50">
              <h3 className="font-semibold mb-2">Datos de Alquiler</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Precio: {property.rentalPrice ? `€${property.rentalPrice}/mes` : "—"}</div>
                <div>Inquilino: {property.tenantName || "—"}</div>
                <div>Email: {property.tenantEmail || "—"}</div>
                <div>Teléfono: {property.tenantPhone || "—"}</div>
                <div>Contrato: {property.leaseStart ? new Date(property.leaseStart).toLocaleDateString() : "—"} — {property.leaseEnd ? new Date(property.leaseEnd).toLocaleDateString() : "—"}</div>
              </div>
            </div>
          )}

          {property.notes && (
            <div>
              <strong>Notas:</strong>
              <p className="mt-1 text-gray-700">{property.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === "map" && (
        <PropertyMapDynamic
          lat={property.locationLat ?? 40.4168}
          lng={property.locationLng ?? -3.7038}
          geoPolygon={property.geoPolygon}
          propertyId={property.id}
        />
      )}

      {tab === "finance" && (
        <PropertyFinance propertyId={property.id} projections={projections} />
      )}

      {tab === "share" && isOwner && <SharePanel propertyId={property.id} />}
    </div>
  );
}

function SharePanel({ propertyId }: { propertyId: string }) {
  const [token, setToken] = useState("");

  async function generateToken() {
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId }),
    });
    const data = await res.json();
    if (data.token) setToken(`${window.location.origin}/share/${data.token}`);
  }

  return (
    <div>
      <p className="mb-4">Genera un enlace público para compartir esta propiedad.</p>
      <button onClick={generateToken} className="rounded bg-blue-600 px-4 py-2 text-white">
        Generar enlace
      </button>
      {token && (
        <div className="mt-4 p-3 border rounded bg-gray-50">
          <p className="text-sm font-mono break-all">{token}</p>
        </div>
      )}
    </div>
  );
}
