import { NextRequest } from "next/server";
import { type ShareRole } from "@/lib/property-access";
import { requirePropertyAccess } from "@/lib/property-api-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  const { id, shareId } = await params;
  const auth = await requirePropertyAccess(id, "manageShares");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const role = body.role === "EDITOR" ? "EDITOR" : "VIEWER";

  const { data: share } = await auth.db
    .from("property_shares")
    .select("id")
    .eq("id", shareId)
    .eq("property_id", id)
    .maybeSingle();

  if (!share) {
    return Response.json({ error: "Acceso no encontrado" }, { status: 404 });
  }

  const { data, error } = await auth.db
    .from("property_shares")
    .update({ role: role as ShareRole })
    .eq("id", shareId)
    .select("*")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  const { id, shareId } = await params;
  const auth = await requirePropertyAccess(id, "manageShares");
  if (!auth.ok) return auth.response;

  const { data: share } = await auth.db
    .from("property_shares")
    .select("id")
    .eq("id", shareId)
    .eq("property_id", id)
    .maybeSingle();

  if (!share) {
    return Response.json({ error: "Acceso no encontrado" }, { status: 404 });
  }

  const { error } = await auth.db.from("property_shares").delete().eq("id", shareId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
