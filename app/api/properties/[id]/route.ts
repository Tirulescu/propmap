import { NextRequest } from "next/server";
import { requirePropertyAccess } from "@/lib/property-api-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requirePropertyAccess(id, "view");
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.db.from("properties").select("*").eq("id", id).single();

  if (error || !data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requirePropertyAccess(id, "owner");
  if (!auth.ok) return auth.response;

  const { error } = await auth.db.from("properties").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
