"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import type { PropertyListItem } from "@/lib/property-access";
import { PROPERTY_TYPE_EMOJI, PROPERTY_TYPE_LABEL } from "@/lib/property-types";
import { filterPropertiesByQueryAndTypes } from "@/lib/property-filters";
import ConfirmDialog from "@/app/components/confirm-dialog";
import PropertyTypeFilter from "@/app/components/property-type-filter";
import { LoadingLabel } from "@/app/components/loading-label";
import { SearchInput } from "@/app/components/search-input";

const STAGGER_CLASS = [
  "animate-fade-in-delay-1",
  "animate-fade-in-delay-2",
  "animate-fade-in-delay-3",
  "animate-fade-in-delay-4",
] as const;

function normalizeText(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value).trim();
}

function addressDiffersFromName(property: PropertyListItem): boolean {
  const address = normalizeText(property.address);
  const name = normalizeText(property.name);
  return Boolean(address && address.toLowerCase() !== name.toLowerCase());
}

function getPropertyDetail(property: PropertyListItem): string | null {
  if (addressDiffersFromName(property)) return null;

  const catastro = normalizeText(property.catastro_ref);
  if (catastro) return `Ref. catastro ${catastro}`;

  if (property.type === "MONTE" || property.type === "PRADO") {
    const species = normalizeText(property.species);
    if (species) return species;
  }

  if (property.type === "CASA" || property.type === "PISO") {
    const rental = normalizeText(property.rental_price);
    if (rental) return `€${rental}/mes`;
    const tenant = normalizeText(property.tenant_name);
    if (tenant) return tenant;
  }

  const registry = normalizeText(property.registry_sheet);
  if (registry) return `Finca ${registry}`;

  return null;
}

export default function PropertyList({
  properties: initial,
}: {
  properties: PropertyListItem[];
}) {
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<PropertyListItem["type"][]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogId, setDialogId] = useState<string | null>(null);
  const router = useRouter();

  const filtered = useMemo(
    () => filterPropertiesByQueryAndTypes(initial, query, selectedTypes),
    [initial, query, selectedTypes]
  );

  async function handleDelete() {
    if (!dialogId) return;
    setDialogOpen(false);
    setDeleting(dialogId);
    try {
      const res = await fetch(`/api/properties/${dialogId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      router.refresh();
    } catch (e: any) {
      alert("Error eliminando: " + e.message);
      setDeleting(null);
    }
  }

  function openDialog(id: string) {
    setDialogId(id);
    setDialogOpen(true);
  }

  const hasTypeFilter = selectedTypes.length > 0;

  return (
    <div className="animate-fade-in min-w-0 max-w-full py-1 sm:py-2">
      <header className="mb-8 space-y-5 sm:mb-10 sm:space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="min-w-0 font-display text-xl font-medium tracking-tight sm:text-2xl">
            Mis Propiedades
          </h1>
          <Link
            href="/properties/new"
            className="btn-primary shrink-0 px-2.5 py-1.5 text-xs font-medium sm:px-3"
          >
            + Nueva
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Buscar propiedades..."
          />

          <PropertyTypeFilter
            selectedTypes={selectedTypes}
            onSelectedTypesChange={setSelectedTypes}
          />
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center animate-fade-in-delay-1 sm:p-12">
          <div className="text-4xl mb-4">📜</div>
          <p className="text-[#6B5E4E] mb-3">No hay propiedades que coincidan.</p>
          <p className="text-sm text-[#9E8F7B]">Prueba con otros filtros.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5">
          {filtered.map((p, i) => {
            const showAddress = addressDiffersFromName(p);
            const address = normalizeText(p.address);
            const detail = getPropertyDetail(p);
            const typeLabel = PROPERTY_TYPE_LABEL[p.type] ?? p.type;
            const isOwner = p.accessRole === "OWNER";
            const canEdit = p.accessRole === "OWNER" || p.accessRole === "EDITOR";

            return (
            <div
              key={p.id}
              className={`card min-w-0 p-4 sm:p-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5 group ${STAGGER_CLASS[Math.min(i, 3)]}`}
            >
              <div className="flex min-w-0 items-start gap-3 sm:gap-4 sm:flex-1">
              <Link
                href={`/properties/${p.id}`}
                className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-[#E8DCC4]/60 flex items-center justify-center text-2xl sm:text-3xl group-hover:bg-[#E8DCC4] transition-colors no-underline"
                aria-hidden="true"
                tabIndex={-1}
              >
                {PROPERTY_TYPE_EMOJI[p.type] || "📍"}
              </Link>
              <div className="min-w-0 flex-1 py-0.5">
                <Link
                  href={`/properties/${p.id}`}
                  className="block no-underline group/link"
                >
                  <h2 className="font-semibold text-[#1A1510] truncate group-hover/link:underline">
                    {p.name}
                  </h2>
                  <p className="mt-1 text-sm text-[#9E8F7B] truncate">
                    {typeLabel}
                    {!isOwner && (
                      <>
                        <span aria-hidden="true" className="mx-1.5 text-[#C9B99A]">·</span>
                        {p.accessRole === "EDITOR" ? "Compartida · Edición" : "Compartida · Lectura"}
                      </>
                    )}
                    {detail && (
                      <>
                        <span aria-hidden="true" className="mx-1.5 text-[#C9B99A]">
                          ·
                        </span>
                        {detail}
                      </>
                    )}
                  </p>
                  {showAddress && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[#6B5E4E] truncate">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="shrink-0 text-[#9E8F7B]"
                        aria-hidden
                      >
                        <path d="M8 14s5-3.5 5-7.5a5 5 0 1 0-10 0C3 10.5 8 14 8 14z" />
                        <circle cx="8" cy="6.5" r="1.5" />
                      </svg>
                      <span className="truncate">{address}</span>
                    </p>
                  )}
                  {p.notes && (
                    <p className="mt-1.5 text-xs text-[#9E8F7B] line-clamp-2">
                      {p.notes}
                    </p>
                  )}
                </Link>
              </div>
              </div>
              <div className="flex gap-2 sm:flex-col sm:shrink-0 sm:self-center">
                {canEdit && (
                <Link
                  href={`/properties/${p.id}/edit`}
                  className="flex-1 sm:flex-none rounded border border-[#C9B99A] px-2.5 py-1.5 text-xs text-[#6B5E4E] transition-colors text-center no-underline"
                  title="Editar"
                >
                  Editar
                </Link>
                )}
                {isOwner && (
                <button
                  onClick={() => openDialog(p.id)}
                  disabled={deleting === p.id}
                  className="flex-1 sm:flex-none rounded border border-[#B54A35]/30 px-2.5 py-1.5 text-xs text-[#B54A35] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
                >
                  <LoadingLabel
                    loading={deleting === p.id}
                    loadingText="Eliminando…"
                    spinnerSize="xs"
                  >
                    Eliminar
                  </LoadingLabel>
                </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={dialogOpen}
        title="Eliminar propiedad"
        message="Esta accion no se puede deshacer. Se borraran todos los datos, proyecciones y registros asociados."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        loading={!!deleting}
        loadingLabel="Eliminando…"
        onConfirm={handleDelete}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  );
}
