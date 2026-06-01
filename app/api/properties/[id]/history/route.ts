import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { requirePropertyAccess } from "@/lib/property-api-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requirePropertyAccess(id, "view");
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.db
    .from("property_history")
    .select("*")
    .eq("property_id", id)
    .order("event_date", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(data || []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requirePropertyAccess(id, "edit");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const content = String(body.content || "").trim();
  if (!content || !body.eventDate) {
    return Response.json({ error: "Fecha y texto son obligatorios" }, { status: 400 });
  }

  const { error } = await auth.db.from("property_history").insert({
    id: nanoid(12),
    property_id: id,
    event_date: new Date(body.eventDate).toISOString(),
    content,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
