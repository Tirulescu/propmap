import { NextRequest } from "next/server";
import { requirePropertyAccess } from "@/lib/property-api-auth";
import { PROPMAP_FILES_BUCKET, storageKeyFromPropmapUrl } from "@/lib/storage-download";
import type { DbPropertyPhoto } from "@/lib/db/types";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id, photoId } = await params;
  const auth = await requirePropertyAccess(id, "edit");
  if (!auth.ok) return auth.response;

  const { data: photo } = await auth.db
    .from("property_photos")
    .select("*")
    .eq("id", photoId)
    .eq("property_id", id)
    .maybeSingle();

  if (!photo) {
    return Response.json({ error: "Foto no encontrada" }, { status: 404 });
  }

  const storageKey = storageKeyFromPropmapUrl((photo as DbPropertyPhoto).url);
  if (storageKey) {
    const { error: storageError } = await auth.client.storage
      .from(PROPMAP_FILES_BUCKET)
      .remove(storageKey);
    if (storageError) {
      console.error("[photos/delete-storage]", storageError.message);
    }
  }

  const { error } = await auth.db
    .from("property_photos")
    .delete()
    .eq("id", photoId)
    .eq("property_id", id);

  if (error) {
    console.error("[photos/delete]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
