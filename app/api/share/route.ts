import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { propertyShares } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { getSession } from "@/lib/insforge-server";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const userId = session.user.id;
  const token = nanoid(24);

  await db.insert(propertyShares).values({
    id: nanoid(12),
    propertyId: body.propertyId,
    sharedById: userId,
    token,
    role: body.role || "VIEWER",
  });

  return Response.json({ token });
}
