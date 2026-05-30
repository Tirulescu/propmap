import { NextRequest } from "next/server";
import { getSession } from "@/lib/insforge-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  // Tabla de chat threads no existe en backend — devolvemos lista vacía
  return Response.json([]);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();

  // Chat no disponible — devolvemos ID placeholder sin persistencia
  const threadId = "stub-thread";
  return Response.json({ threadId });
}