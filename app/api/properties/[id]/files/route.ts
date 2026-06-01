import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { requirePropertyAccess } from "@/lib/property-api-auth";
import { PROPMAP_FILES_BUCKET } from "@/lib/storage-download";
import type { DbDocument } from "@/lib/db/types";

const BUCKET = PROPMAP_FILES_BUCKET;

function serializeDocument(propertyId: string, d: DbDocument) {
  return {
    id: d.id,
    name: d.name,
    url: `/api/properties/${propertyId}/files/${d.id}`,
    type: d.type,
    createdAt: d.created_at,
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
    .from("documents")
    .select("*")
    .eq("property_id", id)
    .order("created_at", { ascending: false });

  const docs = (data ?? []) as DbDocument[];
  return Response.json(docs.map((d) => serializeDocument(id, d)));
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
  if (!file || !(file instanceof Blob)) {
    return Response.json({ error: "Archivo no válido" }, { status: 400 });
  }

  const filename = file instanceof File ? file.name : "documento";
  const { data: upload, error: uploadError } = await auth.client.storage
    .from(BUCKET)
    .uploadAuto(file);

  if (uploadError || !upload) {
    console.error("[files/upload]", uploadError?.message);
    return Response.json(
      { error: uploadError?.message || "Error al subir el archivo" },
      { status: 500 }
    );
  }

  const docId = nanoid(12);
  const { data: doc, error: insertError } = await auth.db
    .from("documents")
    .insert({
      id: docId,
      property_id: id,
      name: filename,
      url: upload.url,
      type: file.type || null,
    })
    .select()
    .single();

  if (insertError) {
    console.error("[files/insert]", insertError.message);
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  return Response.json(serializeDocument(id, doc as DbDocument));
}
