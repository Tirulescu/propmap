"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate } from "@/lib/format-date";
import ConfirmDialog from "@/app/components/confirm-dialog";
import { LoadingLabel } from "@/app/components/loading-label";

interface PropertyDocument {
  id: string;
  name: string;
  url?: string;
  type?: string | null;
  createdAt: string;
}

interface PropertyDocumentsPanelProps {
  propertyId?: string;
  pendingFiles?: File[];
  onPendingFilesChange?: (files: File[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  editable?: boolean;
}

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#9E8F7B]">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function DocumentRowSkeleton({ editable = false }: { editable?: boolean }) {
  return (
    <li
      aria-hidden="true"
      className="flex items-center gap-3 border border-[#E8DCC4] rounded-lg px-3 py-2.5 bg-[#F7F4EF] animate-pulse"
    >
      <div className="h-4 w-4 shrink-0 rounded bg-[#E8DCC4]/80" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3.5 w-[min(100%,14rem)] rounded bg-[#E8DCC4]/80" />
        <div className="h-3 w-16 rounded bg-[#E8DCC4]/55" />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-7 w-12 rounded-lg bg-[#E8DCC4]/70" />
        {editable && <div className="h-7 w-[4.5rem] rounded-lg bg-[#E8DCC4]/55" />}
      </div>
    </li>
  );
}

function ViewButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-lg border border-[#C9B99A] px-2.5 py-1.5 text-xs font-medium text-[#4A6E47] hover:bg-[#E8DCC4]/50 transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      Ver
    </a>
  );
}

function RemoveButton({
  onClick,
  disabled,
  loading,
  label,
  loadingLabel = "Eliminando…",
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label: string;
  loadingLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded-lg border border-[#B54A35]/35 px-2.5 py-1.5 text-xs font-medium text-[#B54A35] hover:bg-[#B54A35]/8 transition-colors disabled:opacity-50"
    >
      {!loading && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      )}
      <LoadingLabel loading={!!loading} loadingText={loadingLabel} spinnerSize="xs">
        {label}
      </LoadingLabel>
    </button>
  );
}

export default function PropertyDocumentsPanel({
  propertyId,
  pendingFiles = [],
  onPendingFilesChange,
  onUploadingChange,
  editable = false,
}: PropertyDocumentsPanelProps) {
  const pendingMode = !propertyId;

  const [files, setFiles] = useState<PropertyDocument[]>([]);
  const [loading, setLoading] = useState(() => Boolean(propertyId));
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PropertyDocument | null>(null);
  const [error, setError] = useState("");

  const refreshFiles = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/files`);
      if (res.ok) setFiles(await res.json());
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (pendingMode) {
      onPendingFilesChange?.([...pendingFiles, file]);
      return;
    }

    setUploading(true);
    setError("");

    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`/api/properties/${propertyId}/files`, {
      method: "POST",
      body: form,
    });

    setUploading(false);

    if (res.ok) {
      refreshFiles();
      return;
    }

    const data = await res.json().catch(() => ({}));
    setError(data.error || "No se pudo subir el documento");
  }

  function removePending(index: number) {
    onPendingFilesChange?.(pendingFiles.filter((_, i) => i !== index));
  }

  async function handleDelete() {
    if (!propertyId || !confirmDelete) return;

    setDeletingId(confirmDelete.id);
    setError("");

    const res = await fetch(
      `/api/properties/${propertyId}/files/${confirmDelete.id}`,
      { method: "DELETE" }
    );

    setDeletingId(null);
    setConfirmDelete(null);

    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== confirmDelete.id));
      return;
    }

    const data = await res.json().catch(() => ({}));
    setError(data.error || "No se pudo eliminar el documento");
  }

  const canUpload = pendingMode || editable;
  const hasItems = pendingMode ? pendingFiles.length > 0 : files.length > 0;

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📄</span>
        <h3 className="font-semibold text-[#1A1510]">Documentación</h3>
      </div>
      <p className="text-sm text-[#6B5E4E] mb-4">
        {pendingMode
          ? "Sube escrituras, contratos, recibos u otros documentos. Se subirán al guardar la propiedad."
          : editable
            ? "Gestiona la documentación de la propiedad: sube archivos nuevos o elimina los existentes."
            : "Escrituras, contratos, recibos y otros documentos de la propiedad."}
      </p>

      <div className="flex flex-col gap-3">
        {error && <p className="text-sm text-[#B54A35] text-center">{error}</p>}

        {loading && !pendingMode ? (
          <ul className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando documentos">
            {[0, 1, 2].map((i) => (
              <DocumentRowSkeleton key={i} editable={editable} />
            ))}
          </ul>
        ) : !hasItems ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-[#E8DCC4] bg-[#F7F4EF]/40 px-4 py-10 text-center">
            {canUpload && (
              <label className="btn-primary cursor-pointer gap-2 px-5 py-2.5 font-medium transition-colors">
                <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <LoadingLabel loading={uploading} loadingText="Subiendo…" spinnerSize="xs">
                  Subir documento
                </LoadingLabel>
              </label>
            )}
            <p className="text-sm text-[#9E8F7B]">
              No hay documentos{pendingMode ? " seleccionados" : " subidos"}.
            </p>
          </div>
        ) : (
          <>
            {canUpload && (
              <div className="flex justify-end">
                <label className="btn-primary cursor-pointer gap-2 px-4 py-2 font-medium transition-colors">
                  <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <LoadingLabel loading={uploading} loadingText="Subiendo…" spinnerSize="xs">
                    Subir documento
                  </LoadingLabel>
                </label>
              </div>
            )}

            {pendingMode ? (
              <ul className="flex flex-col gap-2">
                {pendingFiles.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center gap-3 border border-[#E8DCC4] rounded-lg px-3 py-2.5 bg-[#F7F4EF]"
                  >
                    <DocIcon />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[#1A1510] truncate">{f.name}</div>
                      <div className="text-xs text-[#9E8F7B]">{(f.size / 1024).toFixed(0)} KB</div>
                    </div>
                    <RemoveButton onClick={() => removePending(i)} label="Quitar" />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="flex flex-col gap-2">
                {files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-3 border border-[#E8DCC4] rounded-lg px-3 py-2.5 bg-[#F7F4EF]"
                  >
                    <DocIcon />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[#1A1510] truncate">{f.name}</div>
                      <div className="text-xs text-[#9E8F7B]">{formatDate(f.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {f.url && <ViewButton href={f.url} />}
                      {editable && (
                        <RemoveButton
                          onClick={() => setConfirmDelete(f)}
                          disabled={deletingId === f.id}
                          loading={deletingId === f.id}
                          label="Eliminar"
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar documento"
        message={`¿Seguro que quieres eliminar "${confirmDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={!!deletingId}
        loadingLabel="Eliminando…"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

export async function uploadPendingDocuments(propertyId: string, files: File[]) {
  for (const file of files) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/properties/${propertyId}/files`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `No se pudo subir ${file.name}`);
    }
  }
}
