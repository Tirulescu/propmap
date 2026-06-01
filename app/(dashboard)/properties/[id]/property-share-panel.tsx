"use client";

import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "@/app/components/confirm-dialog";
import { LoadingLabel } from "@/app/components/loading-label";
import type { DbPropertyShare, ShareRole } from "@/lib/db/types";

const ROLE_LABELS: Record<ShareRole, string> = {
  VIEWER: "Lectura",
  EDITOR: "Edición",
};

export default function PropertySharePanel({ propertyId }: { propertyId: string }) {
  const [shares, setShares] = useState<DbPropertyShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("VIEWER");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const loadShares = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/shares`);
      if (res.ok) {
        const data = await res.json();
        setShares(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadShares();
  }, [loadShares]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInviting(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo compartir");
        return;
      }
      setEmail("");
      setRole("VIEWER");
      setShares((prev) => [data, ...prev]);
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(shareId: string, newRole: ShareRole) {
    setUpdatingId(shareId);
    try {
      const res = await fetch(`/api/properties/${propertyId}/shares/${shareId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        const updated = await res.json();
        setShares((prev) => prev.map((s) => (s.id === shareId ? updated : s)));
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemove() {
    if (!confirmRemoveId) return;
    setRemovingId(confirmRemoveId);
    setConfirmRemoveId(null);
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/shares/${confirmRemoveId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setShares((prev) => prev.filter((s) => s.id !== confirmRemoveId));
      }
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="card p-5 sm:p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">👥</span>
        <h3 className="font-semibold text-[#1A1510]">Compartir acceso</h3>
      </div>
      <p className="text-[#6B5E4E] text-sm mb-5">
        Invita a otra persona por correo electrónico. Podrá ver esta propiedad en su cuenta
        con los permisos que elijas.
      </p>

      <form
        onSubmit={handleInvite}
        className="mb-6 p-4 sm:p-5 rounded-lg bg-[#E8DCC4]/20 border border-[#C9B99A]/40 space-y-4"
      >
        <div>
          <label
            htmlFor="share-email"
            className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5"
          >
            Correo electrónico
          </label>
          <input
            id="share-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            required
            autoComplete="email"
            className="w-full"
            suppressHydrationWarning
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 min-w-0">
            <label
              htmlFor="share-role"
              className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5"
            >
              Permiso
            </label>
            <select
              id="share-role"
              value={role}
              onChange={(e) => setRole(e.target.value as ShareRole)}
              className="w-full"
            >
              <option value="VIEWER">{ROLE_LABELS.VIEWER}</option>
              <option value="EDITOR">{ROLE_LABELS.EDITOR}</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting || !email.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#4A6E47] px-5 py-2.5 text-sm text-white hover:bg-[#3a5a37] transition-colors disabled:opacity-60 shrink-0"
          >
            <LoadingLabel loading={inviting} loadingText="Invitando…">
              Invitar
            </LoadingLabel>
          </button>
        </div>

        {error && <p className="text-sm text-[#B54A35]">{error}</p>}
      </form>

      <div>
        <h4 className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-3">
          Personas con acceso
        </h4>

        {loading ? (
          <p className="text-sm text-[#9E8F7B]">Cargando…</p>
        ) : shares.length === 0 ? (
          <p className="text-sm text-[#9E8F7B] italic">
            Todavía no has compartido esta propiedad con nadie.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {shares.map((share) => (
              <li
                key={share.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg bg-[#E8DCC4]/30 border border-[#C9B99A]/40"
              >
                <span className="flex-1 min-w-0 text-sm text-[#1A1510] truncate">
                  {share.shared_with_email}
                </span>
                <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3 shrink-0 sm:min-w-[12rem]">
                  <div className="sm:flex-1">
                    <label
                      htmlFor={`share-role-${share.id}`}
                      className="block text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1 sm:sr-only"
                    >
                      Permiso
                    </label>
                    <select
                      id={`share-role-${share.id}`}
                      value={share.role}
                      onChange={(e) =>
                        handleRoleChange(share.id, e.target.value as ShareRole)
                      }
                      disabled={updatingId === share.id || removingId === share.id}
                      className="w-full text-sm"
                      aria-label={`Permiso de ${share.shared_with_email}`}
                    >
                      <option value="VIEWER">{ROLE_LABELS.VIEWER}</option>
                      <option value="EDITOR">{ROLE_LABELS.EDITOR}</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveId(share.id)}
                    disabled={removingId === share.id}
                    className="rounded-lg border border-[#B54A35]/30 px-2.5 py-1.5 text-xs text-[#B54A35] hover:bg-[#B54A35]/5 transition-colors disabled:opacity-50"
                    title="Eliminar acceso"
                  >
                    <LoadingLabel
                      loading={removingId === share.id}
                      loadingText="…"
                      spinnerSize="xs"
                    >
                      Quitar
                    </LoadingLabel>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmRemoveId}
        title="Eliminar acceso"
        message="Esta persona dejará de poder ver y editar esta propiedad."
        confirmLabel="Eliminar acceso"
        loading={!!removingId}
        loadingLabel="Eliminando…"
        onConfirm={handleRemove}
        onCancel={() => setConfirmRemoveId(null)}
      />
    </div>
  );
}
