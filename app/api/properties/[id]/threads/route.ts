import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { insforgeChatThreads, insforgeMessages } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { createThread, sendMessage, listMessages } from "@/lib/insforge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const threads = await db
    .select()
    .from(insforgeChatThreads)
    .where(eq(insforgeChatThreads.propertyId, id));
  return Response.json(threads);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Create remote thread in InsForge
  const remote = await createThread(body.title || "Nuevo chat");

  const threadId = nanoid(12);
  await db.insert(insforgeChatThreads).values({
    id: threadId,
    propertyId: id,
    title: body.title || "Nuevo chat",
  });

  // Optional first message
  if (body.content) {
    const userMessageId = nanoid(12);
    await db.insert(insforgeMessages).values({
      id: userMessageId,
      threadId,
      role: "user",
      content: body.content,
    });
    await sendMessage(remote.id, body.content);
  }

  return Response.json({ threadId });
}
