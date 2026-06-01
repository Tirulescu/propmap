"use client";

import { useState, useEffect, useCallback, type MutableRefObject } from "react";
import { createPortal } from "react-dom";
import { formatDate } from "@/lib/format-date";
import ConfirmDialog from "@/app/components/confirm-dialog";
import { LoadingLabel } from "@/app/components/loading-label";
import { Spinner } from "@/app/components/spinner";

interface PropertyPhoto {
  id: string;
  name: string;
  url: string;
  photoDate: string;
  type?: string | null;
  createdAt: string;
}

function todayInputValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function PhotoGridSkeleton() {
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          aria-hidden="true"
          className="relative aspect-square overflow-hidden rounded-xl border border-[#E8DCC4] bg-[#E8DCC4]/30 animate-pulse"
        >
          <div className="absolute inset-0 bg-[#E8DCC4]/45" />
          <div className="absolute inset-x-0 bottom-0 space-y-1.5 bg-gradient-to-t from-[#E8DCC4]/95 to-transparent px-2.5 py-2 pt-8">
            <div className="h-3 w-[min(100%,5rem)] rounded bg-[#C9B99A]/70" />
            <div className="h-2.5 w-12 rounded bg-[#C9B99A]/50" />
          </div>
        </div>
      ))}
    </>
  );
}

function PhotoLightbox({
  photos,
  index,
  editable,
  onClose,
  onPrev,
  onNext,
  onDelete,
  deleting,
}: {
  photos: PropertyPhoto[];
  index: number;
  editable?: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const photo = photos[index];

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  if (!photo) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`Vista de foto: ${photo.name}`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white shrink-0">
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{photo.name}</div>
          <div className="text-sm text-white/70">{formatDate(photo.photoDate)}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-white/60 hidden sm:inline">
            {index + 1} / {photos.length}
          </span>
          {editable && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="rounded-lg border border-white/25 px-3 py-1.5 text-sm text-red-300 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <LoadingLabel loading={deleting} loadingText="Eliminando…" spinnerSize="xs">
                Eliminar
              </LoadingLabel>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 w-full flex items-center justify-center px-2 sm:px-12 pb-4">
        {photos.length > 1 && (
          <button
            type="button"
            onClick={onPrev}
            className="absolute left-2 sm:left-4 z-10 rounded-full bg-black/50 p-2.5 text-white hover:bg-black/70 transition-colors"
            aria-label="Foto anterior"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.name}
          className="max-h-[calc(100dvh-5rem)] max-w-[min(100%,calc(100vw-6rem))] w-auto h-auto object-contain rounded-lg shadow-2xl"
        />

        {photos.length > 1 && (
          <button
            type="button"
            onClick={onNext}
            className="absolute right-2 sm:right-4 z-10 rounded-full bg-black/50 p-2.5 text-white hover:bg-black/70 transition-colors"
            aria-label="Foto siguiente"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

export type PropertyPhotosHandle = {
  uploadPendingIfReady: () => Promise<boolean>;
};

type PropertyPhotosProps = {
  propertyId: string;
  editable?: boolean;
  onPendingChange?: (pending: boolean) => void;
  onUploadingChange?: (uploading: boolean) => void;
  uploadActionsRef?: MutableRefObject<PropertyPhotosHandle | null>;
};

export default function PropertyPhotos({
  propertyId,
  editable = false,
  onPendingChange,
  onUploadingChange,
  uploadActionsRef,
}: PropertyPhotosProps) {
  const [photos, setPhotos] = useState<PropertyPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PropertyPhoto | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [photoDate, setPhotoDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    if (editable) setPhotoDate(todayInputValue());
  }, [editable]);

  const refreshPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/photos`);
      if (res.ok) setPhotos(await res.json());
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    refreshPhotos();
  }, [refreshPhotos]);

  useEffect(() => {
    if (selectedFile) setUploadOpen(true);
  }, [selectedFile]);

  useEffect(() => {
    if (error) setUploadOpen(true);
  }, [error]);

  useEffect(() => {
    onPendingChange?.(!!selectedFile);
  }, [selectedFile, onPendingChange]);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen");
      return;
    }
    setError("");
    setSelectedFile(file);
    if (!name.trim()) {
      const baseName = file.name.replace(/\.[^.]+$/, "");
      setName(baseName);
    }
  }

  function resetForm() {
    setName("");
    setPhotoDate(todayInputValue());
    setSelectedFile(null);
  }

  const performUpload = useCallback(async (): Promise<
    { ok: true } | { ok: false; error: string }
  > => {
    if (!selectedFile) {
      return { ok: false, error: "Elige una imagen antes de subir." };
    }
    if (!name.trim()) {
      return { ok: false, error: "El nombre es obligatorio." };
    }
    if (!photoDate) {
      return { ok: false, error: "La fecha es obligatoria." };
    }

    setUploading(true);

    const form = new FormData();
    form.append("file", selectedFile);
    form.append("name", name.trim());
    form.append("photoDate", photoDate);

    try {
      const res = await fetch(`/api/properties/${propertyId}/photos`, {
        method: "POST",
        body: form,
      });

      if (res.ok) {
        const photo = await res.json();
        setPhotos((prev) =>
          [photo, ...prev].sort(
            (a, b) => new Date(b.photoDate).getTime() - new Date(a.photoDate).getTime()
          )
        );
        resetForm();
        return { ok: true };
      }

      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error || "No se pudo subir la foto" };
    } finally {
      setUploading(false);
    }
  }, [selectedFile, name, photoDate, propertyId]);

  useEffect(() => {
    if (!uploadActionsRef) return;

    uploadActionsRef.current = {
      uploadPendingIfReady: async () => {
        if (!selectedFile) return true;
        const result = await performUpload();
        if (!result.ok) {
          setError(result.error);
          return false;
        }
        setError("");
        return true;
      },
    };

    return () => {
      uploadActionsRef.current = null;
    };
  }, [uploadActionsRef, selectedFile, performUpload]);

  async function handleUpload() {
    setError("");
    const result = await performUpload();
    if (!result.ok) setError(result.error);
  }

  async function handleDelete() {
    if (!confirmDelete) return;

    const photoId = confirmDelete.id;
    setDeletingId(photoId);
    setError("");

    const res = await fetch(
      `/api/properties/${propertyId}/photos/${photoId}`,
      { method: "DELETE" }
    );

    setDeletingId(null);

    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      if (lightboxIndex !== null) {
        const remaining = photos.filter((p) => p.id !== photoId);
        if (remaining.length === 0) {
          setLightboxIndex(null);
        } else if (lightboxIndex >= remaining.length) {
          setLightboxIndex(remaining.length - 1);
        }
      }
      setConfirmDelete(null);
      return;
    }

    const data = await res.json().catch(() => ({}));
    setError(data.error || "No se pudo eliminar la foto");
    setConfirmDelete(null);
  }

  function openLightbox(index: number) {
    setLightboxIndex(index);
  }

  function closeLightbox() {
    setLightboxIndex(null);
  }

  function goPrev() {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
  }

  function goNext() {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % photos.length);
  }

  const photoCountLabel = loading
    ? "Cargando…"
    : photos.length === 0
      ? "Sin fotos"
      : photos.length === 1
        ? "1 foto"
        : `${photos.length} fotos`;

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xl" aria-hidden="true">📷</span>
        <h3 className="font-semibold text-[#1A1510]">Fotos</h3>
      </div>
      <p className="text-sm text-[#6B5E4E] mb-4">
        Toca una imagen para verla a pantalla completa.
      </p>

      {(editable || (!loading && photos.length > 0)) && (
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#E8DCC4]/70 pb-3">
          <p className="text-sm text-[#9E8F7B]">{photoCountLabel}</p>
          {editable && (
            <button
              type="button"
              onClick={() => setUploadOpen((open) => !open)}
              className="btn-primary relative shrink-0 gap-1.5 px-4 py-2 font-medium transition-colors disabled:opacity-60"
              aria-expanded={uploadOpen}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Añadir foto</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${uploadOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <path d="M5 7l5 5 5-5" />
              </svg>
              {selectedFile && !uploadOpen && (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-white ring-2 ring-[#4A6E47]"
                  aria-label="Imagen pendiente de subir"
                />
              )}
            </button>
          )}
        </div>
      )}

      {editable && uploadOpen && (
        <div
          className="mb-4 space-y-4 rounded-xl border border-[#E8DCC4] bg-[#F7F4EF]/50 p-4 animate-fade-in"
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.target instanceof HTMLTextAreaElement) return;
            e.preventDefault();
            void handleUpload();
          }}
        >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5 block">
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Fachada principal, Lindero norte…"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5 block">
              Fecha
            </label>
            <input
              type="date"
              value={photoDate}
              onChange={(e) => setPhotoDate(e.target.value)}
              suppressHydrationWarning
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-stretch gap-2.5">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E8DCC4]/80 bg-[#E8DCC4]/15"
              aria-hidden={!!previewUrl}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#C9B99A]"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              )}
            </div>

            <label className="flex min-h-16 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-[#C9B99A]/70 bg-white/50 px-3 py-2 text-center transition-colors hover:border-[#4A6E47]/40 hover:bg-white/80">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <span className="text-sm font-medium text-[#4A6E47]">
                {selectedFile ? "Cambiar imagen" : "Elegir imagen"}
              </span>
              {selectedFile ? (
                <span className="max-w-full truncate px-1 text-xs text-[#6B5E4E]">
                  {selectedFile.name}
                </span>
              ) : (
                <span className="text-xs text-[#9E8F7B]">JPG, PNG o WebP</span>
              )}
            </label>
          </div>

          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={uploading || !selectedFile}
            className="btn-primary w-full shrink-0 px-5 py-2.5 font-medium disabled:opacity-60 sm:w-auto sm:min-w-[7.5rem]"
          >
            {uploading ? (
              <Spinner size="sm" className="border-white/40 border-t-white" label="Subiendo foto" />
            ) : (
              "Subir foto"
            )}
          </button>
        </div>
        </div>
      )}

      {error && <p className="text-sm text-[#B54A35] mb-4">{error}</p>}

      {loading ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          aria-busy="true"
          aria-label="Cargando fotos"
        >
          <PhotoGridSkeleton />
        </div>
      ) : photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E8DCC4] bg-[#F7F4EF]/40 px-4 py-10 text-center">
          <p className="text-sm text-[#9E8F7B]">
            {editable ? "Aún no hay fotos en esta propiedad." : "No hay fotos todavía."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-[#E8DCC4] bg-[#E8DCC4]/30"
            >
              <button
                type="button"
                onClick={() => openLightbox(index)}
                className="block h-full w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4A6E47]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2.5 py-2 pt-8 pointer-events-none">
                  <div className="text-xs font-medium text-white truncate">{photo.name}</div>
                  <div className="text-[10px] text-white/75">{formatDate(photo.photoDate)}</div>
                </div>
              </button>
              {editable && (
              <button
                type="button"
                onClick={() => setConfirmDelete(photo)}
                className="absolute top-2 right-2 z-10 rounded-full bg-black/50 p-1.5 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-[#B54A35] transition-all"
                aria-label={`Eliminar ${photo.name}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
              )}
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          index={lightboxIndex}
          editable={editable}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
          onDelete={() => setConfirmDelete(photos[lightboxIndex])}
          deleting={deletingId === photos[lightboxIndex]?.id}
        />
      )}

      {editable && (
      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar foto"
        message={`¿Seguro que quieres eliminar "${confirmDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={!!deletingId}
        loadingLabel="Eliminando…"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
      )}
    </div>
  );
}
