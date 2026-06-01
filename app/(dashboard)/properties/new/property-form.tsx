"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createProperty } from "./actions";
import PropertyDocumentsPanel, {
  uploadPendingDocuments,
} from "../[id]/property-documents-panel";
import { LoadingLabel } from "@/app/components/loading-label";
import { Spinner } from "@/app/components/spinner";
import { DEFAULT_MAP_CENTER } from "@/lib/map-constants";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/property-types";

const MapEditorDynamic = dynamic(() => import("./map-editor"), {
  ssr: false,
  loading: () => (
    <div className="card p-6 text-center text-[#6B5E4E]">
      <Spinner size="sm" className="mx-auto mb-2" />
      Cargando mapa…
    </div>
  ),
});

export default function PropertyForm() {
  const router = useRouter();
  const [type, setType] = useState("MONTE");
  const [polygon, setPolygon] = useState<any>(null);
  const [mapLat, setMapLat] = useState<number>(DEFAULT_MAP_CENTER.lat);
  const [mapLng, setMapLng] = useState<number>(DEFAULT_MAP_CENTER.lng);
  const [pendingDocs, setPendingDocs] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setSubmitError("");

    try {
      formData.set("geoPolygon", polygon ? JSON.stringify(polygon) : "null");
      formData.set("locationLat", String(mapLat));
      formData.set("locationLng", String(mapLng));

      const { id } = await createProperty(formData);

      if (pendingDocs.length > 0) {
        await uploadPendingDocuments(id, pendingDocs);
      }

      router.push(`/properties/${id}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error al guardar";
      setSubmitError(message);
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5 max-w-2xl animate-fade-in">
      {/* Selector de tipo estilo chips */}
      <div>
          <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-2">
            Tipo de propiedad
          </label>
          <div className="pill-group">
            {PROPERTY_TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`pill-btn cursor-pointer ${
                  type === opt.value ? "pill-btn-active" : "pill-btn-inactive"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={opt.value}
                  checked={type === opt.value}
                  onChange={() => setType(opt.value)}
                  className="sr-only"
                />
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Nombre *</label>
            <input name="name" required placeholder="Ej: Monte de Louredo" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Dirección</label>
            <input name="address" placeholder="Ej: Rúa do Porto, 42, Fene" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Ref. Catastro</label>
            <input name="catastroRef" placeholder="Ej: 15035A00100123" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">URL Catastro</label>
            <input name="catastroUrl" type="url" placeholder="https://www1.sedecatastro.gob.es/..." />
          </div>
        </div>

        {type === "MONTE" && (
          <div className="card p-4 sm:p-5 animate-fade-in-delay-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🌲</span>
              <h3 className="font-semibold text-[#1A1510]">Datos del Monte</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Fecha de plantacion</label>
                <input name="plantedDate" type="date" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Especie / Arbol</label>
                <input name="species" placeholder="Ej: Eucalyptus, Pino" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Ultima tala</label>
                <input name="lastHarvestDate" type="date" />
              </div>
            </div>
          </div>
        )}

        {(type === "PISO" || type === "CASA") && <TenantSection />}

        <div>
          <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Notas</label>
          <textarea name="notes" rows={3} placeholder="Cualquier detalle adicional..." />
        </div>

        <PropertyDocumentsPanel
          pendingFiles={pendingDocs}
          onPendingFilesChange={setPendingDocs}
        />

      <div className="card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🗺️</span>
          <h3 className="font-semibold text-ink">Área en mapa</h3>
        </div>
        <MapEditorDynamic
          lat={DEFAULT_MAP_CENTER.lat}
          lng={DEFAULT_MAP_CENTER.lng}
          onChange={setPolygon}
          onPositionChange={(lt, ln) => {
            setMapLat(parseFloat(lt.toFixed(6)));
            setMapLng(parseFloat(ln.toFixed(6)));
          }}
        />
      </div>

      {submitError && (
        <p className="text-sm text-[#B54A35]">{submitError}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[#4A6E47] px-5 py-2.5 text-sm text-white hover:bg-[#3a5a37] transition-colors font-medium disabled:opacity-60"
        >
          <LoadingLabel loading={submitting} loadingText="Guardando…">
            Guardar propiedad
          </LoadingLabel>
        </button>
        <a
          href="/properties"
          className="inline-flex items-center justify-center rounded-lg border border-[#C9B99A] px-5 py-2.5 text-sm text-[#6B5E4E] hover:bg-[#E8DCC4]/50 transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}

function TenantSection() {
  const [open, setOpen] = useState(false);
  return (
    <div className="card p-4 sm:p-5 animate-fade-in-delay-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🔑</span>
          <h3 className="font-semibold text-[#1A1510]">Datos de Alquiler</h3>
        </div>
        <svg
          width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6B5E4E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M5 7l5 5 5-5" />
        </svg>
      </button>

      {open && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Precio alquiler (€/mes)</label>
            <input name="rentalPrice" type="number" step="0.01" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Inquilino</label>
            <input name="tenantName" placeholder="Nombre completo" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Email inquilino</label>
            <input name="tenantEmail" type="email" placeholder="inquilino@email.com" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Telefono inquilino</label>
            <input name="tenantPhone" placeholder="+34 600 000 000" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Inicio contrato</label>
            <input name="leaseStart" type="date" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Fin contrato</label>
            <input name="leaseEnd" type="date" />
          </div>
        </div>
      )}
    </div>
  );
}
