import { NextRequest } from "next/server";
import { getSession } from "@/lib/insforge-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  // Tabla insforge_files no existe en backend — devolvemos lista vacía
  return Response.json([]);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  // Storage no configurado en este backend
  return Response.json({ error: "Storage not configured" }, { status: 503 });
}