"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDate, toDateInputValue } from "@/lib/format-date";
import ConfirmDialog from "@/app/components/confirm-dialog";
import { LoadingLabel } from "@/app/components/loading-label";

export interface HistoryEntry {
  id: string;
  event_date: string;
  content: string;
}

export default function PropertyHistory({
  propertyId,
  entries: initialEntries,
  editable = true,
}: {
  propertyId: string;
  entries: HistoryEntry[];
  editable?: boolean;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [eventDate, setEventDate] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<HistoryEntry | null>(null);
  const router = useRouter();

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventDate, content }),
      });
      if (!res.ok) return;
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function startEdit(entry: HistoryEntry) {
    setEditingId(entry.id);
    setEditDate(toDateInputValue(entry.event_date));
    setEditContent(entry.content);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(entryId: string) {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/history/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventDate: editDate, content: editContent }),
      });
      if (!res.ok) return;
      setEntries((prev) =>
        prev
          .map((e) =>
            e.id === entryId
              ? { ...e, event_date: new Date(editDate).toISOString(), content: editContent }
              : e
          )
          .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
      );
      setEditingId(null);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const entryId = confirmDelete.id;
    setDeletingId(entryId);
    try {
      const res = await fetch(`/api/properties/${propertyId}/history/${entryId}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      setConfirmDelete(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lg">📜</span>
        <h3 className="font-semibold text-[#1A1510]">Histórico</h3>
      </div>

      {editable && (
      <form onSubmit={addEntry} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-8">
        <div>
          <label className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5 block">Fecha</label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            suppressHydrationWarning
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5 block">Texto</label>
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder="Ej: Tala de eucaliptos, revisión de lindes..."
            suppressHydrationWarning
          />
        </div>
        <div className="sm:col-span-3 flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#4A6E47] px-5 py-2.5 text-sm text-white hover:bg-[#3a5a37] transition-colors font-medium disabled:opacity-60"
          >
            <LoadingLabel loading={saving} loadingText="Guardando…">
              Añadir
            </LoadingLabel>
          </button>
        </div>
      </form>
      )}

      <div className="card overflow-hidden border border-[#E8DCC4]/60 -mx-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[360px]">
            <thead>
              <tr className="bg-[#E8DCC4]/40">
                <th className="px-4 py-3 text-left font-medium text-[#6B5E4E] w-[120px]">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-[#6B5E4E]">Texto</th>
                {editable && (
                <th className="px-4 py-3 text-right font-medium text-[#6B5E4E] w-[140px]">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isEditing = editingId === entry.id;
                return (
                  <tr key={entry.id} className="border-t border-[#E8DCC4]/60 text-[#1A1510]">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full min-w-[120px]"
                          required
                        />
                      ) : (
                        formatDate(entry.event_date)
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {isEditing ? (
                        <input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full"
                          required
                        />
                      ) : (
                        entry.content
                      )}
                    </td>
                    {editable && (
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEdit(entry.id)}
                              disabled={savingEdit}
                              className="rounded-lg bg-[#4A6E47] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#3a5a37] transition-colors disabled:opacity-50"
                            >
                              <LoadingLabel loading={savingEdit} loadingText="Guardando…" spinnerSize="xs">
                                Guardar
                              </LoadingLabel>
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={savingEdit}
                              className="rounded-lg border border-[#C9B99A] px-2.5 py-1.5 text-xs font-medium text-[#6B5E4E] hover:bg-[#E8DCC4]/50 transition-colors disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(entry)}
                              disabled={!!editingId || deletingId === entry.id}
                              className="rounded-lg border border-[#C9B99A] px-2.5 py-1.5 text-xs font-medium text-[#4A6E47] hover:bg-[#E8DCC4]/50 transition-colors disabled:opacity-50"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(entry)}
                              disabled={!!editingId || deletingId === entry.id}
                              className="rounded-lg border border-[#B54A35]/35 px-2.5 py-1.5 text-xs font-medium text-[#B54A35] hover:bg-[#B54A35]/8 transition-colors disabled:opacity-50"
                            >
                              <LoadingLabel
                                loading={deletingId === entry.id}
                                loadingText="Eliminando…"
                                spinnerSize="xs"
                              >
                                Eliminar
                              </LoadingLabel>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    )}
                  </tr>
                );
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={editable ? 3 : 2} className="px-4 py-10 text-center text-[#9E8F7B]">
                    {editable ? "Sin entradas. Añade la primera arriba." : "Sin entradas en el histórico."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar entrada"
        message={`¿Seguro que quieres eliminar la entrada del ${confirmDelete ? formatDate(confirmDelete.event_date) : ""}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={!!deletingId}
        loadingLabel="Eliminando…"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
