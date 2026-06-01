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
    .from("projections")
    .select("*")
    .eq("property_id", id)
    .order("year", { ascending: false });

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
  const { error } = await auth.db.from("projections").insert({
    id: nanoid(12),
    property_id: id,
    year: body.year ?? new Date().getFullYear(),
    month: body.month ?? 1,
    type: body.type,
    category: body.category,
    amount: body.amount,
    description: body.description || null,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
