import { NextRequest } from "next/server";
import { insforge } from "@/lib/db";
import { getSession } from "@/lib/insforge-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { error } = await insforge.database
    .from("properties")
    .update({ geo_polygon: body.polygon })
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
