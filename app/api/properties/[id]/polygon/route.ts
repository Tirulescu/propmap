import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { properties } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await req.json();
  await db
    .update(properties)
    .set({ geoPolygon: body.polygon })
    .where(eq(properties.id, id));

  return Response.json({ ok: true });
}
