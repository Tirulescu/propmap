import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { PROPMAP_FILES_BUCKET } from "@/lib/storage-download";
import { requirePropertyAccess } from "@/lib/property-api-auth";
import type { DbPropertyPhoto } from "@/lib/db/types";

const BUCKET = PROPMAP_FILES_BUCKET;
const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

function serializePhoto(propertyId: string, p: DbPropertyPhoto) {
  return {
    id: p.id,
    name: p.name,
    url: `/api/properties/${propertyId}/photos/${p.id}/image`,
    photoDate: p.photo_date,
    type: p.type,
    createdAt: p.created_at,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requirePropertyAccess(id, "view");
  if (!auth.ok) return auth.response;

  const { data } = await auth.db
    .from("property_photos")
    .select("*")
    .eq("property_id", id)
    .order("photo_date", { ascending: false });

  const photos = (Array.isArray(data) ? data : []) as DbPropertyPhoto[];
  return Response.json(photos.map((p) => serializePhoto(id, p)));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requirePropertyAccess(id, "edit");
  if (!auth.ok) return auth.response;

  const formData = await req.formData();
  const file = formData.get("file");
  const name = String(formData.get("name") || "").trim();
  const photoDate = String(formData.get("photoDate") || "").trim();

  if (!file || !(file instanceof Blob)) {
    return Response.json({ error: "Archivo no válido" }, { status: 400 });
  }
  if (!name) {
    return Response.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }
  if (!photoDate) {
    return Response.json({ error: "La fecha es obligatoria" }, { status: 400 });
  }

  const mimeType = file.type || "";
  if (mimeType && !IMAGE_TYPES.has(mimeType)) {
    return Response.json(
      { error: "Solo se permiten imágenes (JPEG, PNG, WebP, GIF, HEIC)" },
      { status: 400 }
    );
  }

  const { data: upload, error: uploadError } = await auth.client.storage
    .from(BUCKET)
    .uploadAuto(file);

  if (uploadError || !upload) {
    console.error("[photos/upload]", uploadError?.message);
    return Response.json(
      { error: uploadError?.message || "Error al subir la imagen" },
      { status: 500 }
    );
  }

  const photoId = nanoid(12);
  const { data: photo, error: insertError } = await auth.db
    .from("property_photos")
    .insert({
      id: photoId,
      property_id: id,
      name,
      url: upload.url,
      photo_date: new Date(photoDate).toISOString(),
      type: mimeType || null,
    })
    .select()
    .single();

  if (insertError) {
    console.error("[photos/insert]", insertError.message);
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  return Response.json(serializePhoto(id, photo as DbPropertyPhoto));
}
