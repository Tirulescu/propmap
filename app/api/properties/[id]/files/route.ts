import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { insforgeFiles } from "@/lib/db/schema";
import { getSession } from "@/lib/insforge-server";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { uploadToInsForge } from "@/lib/insforge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const files = await db
    .select()
    .from(insforgeFiles)
    .where(eq(insforgeFiles.propertyId, id));
  return Response.json(files);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return new Response("Missing file", { status: 400 });

  const bytes = await file.arrayBuffer();
  const { fileId, url } = await uploadToInsForge(bytes, file.name, file.type);

  const recordId = nanoid(12);
  await db.insert(insforgeFiles).values({
    id: recordId,
    propertyId: id,
    insforgeFileId: fileId,
    name: file.name,
    url,
    status: "UPLOADED",
  });

  return Response.json({ id: recordId, fileId, url });
}
