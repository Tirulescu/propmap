import { NextRequest } from "next/server";
import { requirePropertyAccess } from "@/lib/property-api-auth";
import {
  contentDispositionInline,
  PROPMAP_FILES_BUCKET,
  storageKeyFromPropmapUrl,
} from "@/lib/storage-download";
import type { DbDocument } from "@/lib/db/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await params;
  const auth = await requirePropertyAccess(id, "view");
  if (!auth.ok) return auth.response;

  const { data: doc } = await auth.db
    .from("documents")
    .select("*")
    .eq("id", docId)
    .eq("property_id", id)
    .maybeSingle();

  if (!doc) {
    return new Response("Not found", { status: 404 });
  }

  const storageKey = storageKeyFromPropmapUrl((doc as DbDocument).url);
  if (!storageKey) {
    return new Response("Invalid storage URL", { status: 500 });
  }

  const { data: blob, error } = await auth.client.storage
    .from(PROPMAP_FILES_BUCKET)
    .download(storageKey);
  if (error || !blob) {
    console.error("[files/download]", error?.message);
    return new Response("Error al cargar el documento", { status: 500 });
  }

  return new Response(blob, {
    headers: {
      "Content-Type": (doc as DbDocument).type || blob.type || "application/octet-stream",
      "Content-Disposition": contentDispositionInline((doc as DbDocument).name),
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await params;
  const auth = await requirePropertyAccess(id, "edit");
  if (!auth.ok) return auth.response;

  const { data: doc } = await auth.db
    .from("documents")
    .select("*")
    .eq("id", docId)
    .eq("property_id", id)
    .maybeSingle();

  if (!doc) {
    return Response.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  const storageKey = storageKeyFromPropmapUrl((doc as DbDocument).url);
  if (storageKey) {
    const { error: storageError } = await auth.client.storage
      .from(PROPMAP_FILES_BUCKET)
      .remove(storageKey);
    if (storageError) {
      console.error("[files/delete-storage]", storageError.message);
    }
  }

  const { error } = await auth.db
    .from("documents")
    .delete()
    .eq("id", docId)
    .eq("property_id", id);

  if (error) {
    console.error("[files/delete]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
