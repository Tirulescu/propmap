import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { projections } from "@/lib/db/schema";
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
  await db.insert(projections).values({
    id: nanoid(12),
    propertyId: id,
    year: body.year ?? new Date().getFullYear(),
    month: body.month ?? 1,
    type: body.type,
    category: body.category,
    amount: String(body.amount),
    description: body.description || null,
  });

  return Response.json({ ok: true });
}
