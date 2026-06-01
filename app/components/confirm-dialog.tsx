"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { LoadingLabel } from "./loading-label";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  loadingLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  loadingLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onCancel]);

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[#1A1510]/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-lg border border-[#C9B99A] p-5 sm:p-6 shadow-[0_12px_40px_rgba(26,21,16,0.18)] animate-fade-in">
        <h3 className="font-display font-medium text-ink text-lg mb-2">
          {title}
        </h3>
        <p className="text-sm text-[#6B5E4E] mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-[#C9B99A] px-4 py-2 text-sm text-[#6B5E4E] hover:bg-[#E8DCC4] transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-[#B54A35] px-4 py-2 text-sm text-[#F7F4EF] hover:bg-[#943a28] transition-colors disabled:opacity-50 min-w-[7rem]"
          >
            <LoadingLabel loading={loading} loadingText={loadingLabel ?? confirmLabel}>
              {confirmLabel}
            </LoadingLabel>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
