import { NextRequest } from "next/server";
import { insforge } from "@/lib/db";
import { nanoid } from "nanoid";
import { getSession } from "@/lib/insforge-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { error } = await insforge.database.from("projections").insert({
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
