import { NextRequest } from "next/server";
import { requirePropertyAccess } from "@/lib/property-api-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requirePropertyAccess(id, "edit");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { error } = await auth.db
    .from("properties")
    .update({ geo_polygon: body.polygon })
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
