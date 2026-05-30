import { NextRequest } from "next/server";
import { insforge } from "@/lib/db";
import { nanoid } from "nanoid";
import { getSession } from "@/lib/insforge-server";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const userId = session.user.id;
  const token = nanoid(24);

  const { error } = await insforge.database.from("property_shares").insert({
    id: nanoid(12),
    property_id: body.propertyId,
    shared_by_id: userId,
    token,
    role: body.role || "VIEWER",
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ token });
}
