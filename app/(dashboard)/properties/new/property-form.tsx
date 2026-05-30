"use client";

import { useState } from "react";
import { createProperty } from "./actions";

export default function PropertyForm() {
  const [type, setType] = useState("MONTE");

  return (
    <form action={createProperty} className="flex flex-col gap-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium">Tipo</label>
        <select name="type" value={type} onChange={(e) => setType(e.target.value)} className="border rounded w-full px-3 py-2">
          <option value="MONTE">Monte</option>
          <option value="PRADO">Prado</option>
          <option value="CASA">Casa</option>
          <option value="PISO">Piso</option>
          <option value="TERRENO">Terreno</option>
          <option value="FINCA">Finca</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <input name="name" required className="border rounded w-full px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium">Dirección</label>
        <input name="address" className="border rounded w-full px-3 py-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Lat</label>
          <input name="locationLat" type="number" step="any" className="border rounded w-full px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Lng</label>
          <input name="locationLng" type="number" step="any" className="border rounded w-full px-3 py-2" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Ref. Catastro</label>
        <input name="catastroRef" className="border rounded w-full px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium">URL Catastro</label>
        <input name="catastroUrl" type="url" className="border rounded w-full px-3 py-2" />
      </div>

      {type === "MONTE" && (
        <div className="flex flex-col gap-4 border rounded p-4">
          <h3 className="font-semibold">Datos del Monte</h3>
          <div>
            <label className="block text-sm font-medium">Fecha de plantación</label>
            <input name="plantedDate" type="date" className="border rounded w-full px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Especie/Árbol</label>
            <input name="species" className="border rounded w-full px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Última tala</label>
            <input name="lastHarvestDate" type="date" className="border rounded w-full px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Ganancia última tala (€)</label>
            <input name="lastHarvestProfit" type="number" step="0.01" className="border rounded w-full px-3 py-2" />
          </div>
        </div>
      )}

      {(type === "PISO" || type === "CASA") && (
        <div className="flex flex-col gap-4 border rounded p-4">
          <h3 className="font-semibold">Datos de Alquiler</h3>
          <div>
            <label className="block text-sm font-medium">Precio alquiler (€/mes)</label>
            <input name="rentalPrice" type="number" step="0.01" className="border rounded w-full px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Inquilino</label>
            <input name="tenantName" className="border rounded w-full px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Email inquilino</label>
            <input name="tenantEmail" type="email" className="border rounded w-full px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Teléfono inquilino</label>
            <input name="tenantPhone" className="border rounded w-full px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Inicio contrato</label>
              <input name="leaseStart" type="date" className="border rounded w-full px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Fin contrato</label>
              <input name="leaseEnd" type="date" className="border rounded w-full px-3 py-2" />
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Notas</label>
        <textarea name="notes" rows={3} className="border rounded w-full px-3 py-2"></textarea>
      </div>

      <button type="submit" className="rounded bg-[#4A6E47] px-4 py-2 text-white w-fit">Guardar</button>
    </form>
  );
}
