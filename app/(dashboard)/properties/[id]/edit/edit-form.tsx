"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import type { DbProperty } from "@/lib/db/types";
import { updateProperty, deleteProperty } from "./actions";
import ConfirmDialog from "@/app/components/confirm-dialog";
import { LoadingLabel } from "@/app/components/loading-label";
import { Spinner } from "@/app/components/spinner";
import PropertyDocumentsPanel from "../property-documents-panel";
import PropertyPhotos, { type PropertyPhotosHandle } from "../property-photos";
import { toDateInputValue } from "@/lib/format-date";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/property-types";

const LocationPickerDynamic = dynamic(() => import("@/app/components/location-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-[240px] rounded-lg border border-[#E8DCC4] flex flex-col items-center justify-center gap-2 text-[#9E8F7B] text-sm">
      <Spinner size="sm" />
      Cargando mapa…
    </div>
  ),
});

const MapEditorDynamic = dynamic(() => import("../../new/map-editor"), {
  ssr: false,
  loading: () => (
    <div className="card p-6 text-center text-[#6B5E4E]">
      <Spinner size="sm" className="mx-auto mb-2" />
      Cargando mapa…
    </div>
  ),
});

export default function EditForm({ property }: { property: DbProperty }) {
  const [type, setType] = useState<"MONTE" | "PRADO" | "CASA" | "PISO" | "TERRENO" | "FINCA">(property.type);
  const [polygon, setPolygon] = useState<any>(property.geo_polygon);
  const [latValue, setLatValue] = useState<number | null>(property.location_lat);
  const [lngValue, setLngValue] = useState<number | null>(property.location_lng);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [docsUploading, setDocsUploading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const photosRef = useRef<PropertyPhotosHandle | null>(null);

  async function handleSubmit(formData: FormData) {
    if (docsUploading || photoUploading) {
      setSubmitError("Espera a que termine la subida antes de guardar.");
      return;
    }

    setSubmitError("");

    const photoReady = await photosRef.current?.uploadPendingIfReady();
    if (photoReady === false) return;

    setSubmitting(true);

    try {
      formData.set("geoPolygon", polygon ? JSON.stringify(polygon) : "null");
      formData.set("locationLat", latValue != null ? String(latValue) : "");
      formData.set("locationLng", lngValue != null ? String(lngValue) : "");
      await updateProperty(property.id, formData);
    } catch (e: unknown) {
      if (isRedirectError(e)) throw e;

      const message =
        e instanceof Error && e.message && !e.message.startsWith("NEXT_")
          ? e.message
          : "No se pudo guardar. Comprueba tu sesión e inténtalo de nuevo.";

      if (/autenticado|Unauthorized|401/i.test(message)) {
        window.location.href = "/login";
        return;
      }

      setSubmitError(message);
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteProperty(property.id);
    } catch (e: unknown) {
      if (isRedirectError(e)) throw e;

      const message = e instanceof Error ? e.message : "Error eliminando";
      if (/autenticado|Unauthorized|401/i.test(message)) {
        window.location.href = "/login";
        return;
      }

      alert("Error eliminando: " + message);
      setDeleting(false);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5 max-w-2xl animate-fade-in">
      {/* Selector tipo */}
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
          <input name="name" required defaultValue={property.name} placeholder="Ej: Monte de Louredo" />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Dirección</label>
          <input name="address" defaultValue={property.address || ""} placeholder="Ej: Rúa do Porto, 42, Fene" />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Ref. Catastro</label>
          <input name="catastroRef" defaultValue={property.catastro_ref || ""} placeholder="Ej: 15035A00100123" />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">URL Catastro</label>
          <input name="catastroUrl" type="url" defaultValue={property.catastro_url || ""} placeholder="https://www1.sedecatastro.gob.es/..." />
        </div>
      </div>

      <div className="card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📍</span>
          <h3 className="font-semibold text-[#1A1510]">Ubicación de acceso</h3>
        </div>
        <LocationPickerDynamic
          lat={latValue}
          lng={lngValue}
          onChange={(lt, ln) => {
            setLatValue(lt);
            setLngValue(ln);
          }}
        />
      </div>

      {/* Mapa editor de área */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🗺️</span>
          <h3 className="font-semibold text-ink">Área en mapa</h3>
        </div>
        <MapEditorDynamic
          lat={property.location_lat ?? 40.4168}
          lng={property.location_lng ?? -3.7038}
          geoPolygon={polygon}
          onChange={setPolygon}
          onPositionChange={(lt, ln) => {
            setLatValue(parseFloat(lt.toFixed(6)));
            setLngValue(parseFloat(ln.toFixed(6)));
          }}
        />
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
              <input name="plantedDate" type="date" defaultValue={toDateInputValue(property.planted_date)} />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Especie / Arbol</label>
              <input name="species" defaultValue={property.species || ""} placeholder="Ej: Eucalyptus, Pino" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Ultima tala</label>
              <input name="lastHarvestDate" type="date" defaultValue={toDateInputValue(property.last_harvest_date)} />
            </div>
          </div>
        </div>
      )}

      {(type === "PISO" || type === "CASA") && <TenantSection property={property} />}

      <div>
        <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Notas</label>
        <textarea name="notes" rows={3} defaultValue={property.notes || ""} placeholder="Cualquier detalle adicional..." />
      </div>

      <PropertyPhotos
        uploadActionsRef={photosRef}
        propertyId={property.id}
        editable
        onUploadingChange={setPhotoUploading}
      />

      <PropertyDocumentsPanel
        propertyId={property.id}
        editable
        onUploadingChange={setDocsUploading}
      />

      {submitError && (
        <p className="text-sm text-[#B54A35]">{submitError}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || docsUploading || photoUploading}
          className="rounded-lg bg-[#4A6E47] px-5 py-2.5 text-sm text-white hover:bg-[#3a5a37] transition-colors font-medium disabled:opacity-60"
        >
          <LoadingLabel
            loading={submitting || docsUploading || photoUploading}
            loadingText={
              submitting ? "Guardando…" : photoUploading ? "Subiendo foto…" : "Esperando subida…"
            }
          >
            Guardar cambios
          </LoadingLabel>
        </button>
        <a
          href={`/properties/${property.id}`}
          className="inline-flex items-center justify-center rounded-lg border border-[#C9B99A] px-5 py-2.5 text-sm text-[#6B5E4E] hover:bg-[#E8DCC4]/50 transition-colors"
        >
          Cancelar
        </a>
        <button
          type="button"
          onClick={() => setShowDeleteDialog(true)}
          disabled={deleting}
          className="inline-flex items-center justify-center rounded-lg border border-[#B54A35]/40 px-5 py-2.5 text-sm text-[#B54A35] transition-colors disabled:opacity-50 sm:ml-auto"
        >
          <LoadingLabel loading={deleting} loadingText="Eliminando…">
            Eliminar propiedad
          </LoadingLabel>
        </button>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Eliminar propiedad"
        message="Esta accion no se puede deshacer. Eliminar esta propiedad permanentemente?"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        loadingLabel="Eliminando…"
        onCancel={() => { setShowDeleteDialog(false); setDeleting(false); }}
      />
    </form>
  );
}

function TenantSection({ property }: { property: DbProperty }) {
  const [open, setOpen] = useState(!!(property.rental_price || property.tenant_name));
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
            <input name="rentalPrice" type="number" step="0.01" defaultValue={property.rental_price || ""} placeholder="0.00" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Inquilino</label>
            <input name="tenantName" defaultValue={property.tenant_name || ""} placeholder="Nombre completo" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Email inquilino</label>
            <input name="tenantEmail" type="email" defaultValue={property.tenant_email || ""} placeholder="inquilino@email.com" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Telefono inquilino</label>
            <input name="tenantPhone" defaultValue={property.tenant_phone || ""} placeholder="+34 600 000 000" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Inicio contrato</label>
            <input name="leaseStart" type="date" defaultValue={toDateInputValue(property.lease_start)} />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5">Fin contrato</label>
            <input name="leaseEnd" type="date" defaultValue={toDateInputValue(property.lease_end)} />
          </div>
        </div>
      )}
    </div>
  );
}
