import { NextRequest } from "next/server";
import { requirePropertyAccess } from "@/lib/property-api-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { id, entryId } = await params;
  const auth = await requirePropertyAccess(id, "edit");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const content = String(body.content || "").trim();
  if (!content || !body.eventDate) {
    return Response.json({ error: "Fecha y texto son obligatorios" }, { status: 400 });
  }

  const { error } = await auth.db
    .from("property_history")
    .update({
      event_date: new Date(body.eventDate).toISOString(),
      content,
    })
    .eq("id", entryId)
    .eq("property_id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { id, entryId } = await params;
  const auth = await requirePropertyAccess(id, "edit");
  if (!auth.ok) return auth.response;

  const { error } = await auth.db
    .from("property_history")
    .delete()
    .eq("id", entryId)
    .eq("property_id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
