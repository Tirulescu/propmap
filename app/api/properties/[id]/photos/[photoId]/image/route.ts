import { NextRequest } from "next/server";
import { requirePropertyAccess } from "@/lib/property-api-auth";
import { PROPMAP_FILES_BUCKET, storageKeyFromPropmapUrl } from "@/lib/storage-download";
import type { DbPropertyPhoto } from "@/lib/db/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id, photoId } = await params;
  const auth = await requirePropertyAccess(id, "view");
  if (!auth.ok) return auth.response;

  const { data: photo } = await auth.db
    .from("property_photos")
    .select("*")
    .eq("id", photoId)
    .eq("property_id", id)
    .maybeSingle();

  if (!photo) {
    return new Response("Not found", { status: 404 });
  }

  const storageKey = storageKeyFromPropmapUrl((photo as DbPropertyPhoto).url);
  if (!storageKey) {
    return new Response("Invalid storage URL", { status: 500 });
  }

  const { data: blob, error } = await auth.client.storage
    .from(PROPMAP_FILES_BUCKET)
    .download(storageKey);
  if (error || !blob) {
    console.error("[photos/image]", error?.message);
    return new Response("Error al cargar la imagen", { status: 500 });
  }

  const contentType = (photo as DbPropertyPhoto).type || blob.type || "image/jpeg";

  return new Response(blob, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
