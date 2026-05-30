const BASE = process.env.INSFORGE_API_BASE_URL || "https://insforge.tirulescu.com";
const KEY = process.env.INSFORGE_API_KEY || "";

async function insforge(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`InsForge ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function uploadToInsForge(
  fileBuffer: ArrayBuffer,
  filename: string,
  mimeType: string
): Promise<{ fileId: string; name: string; url?: string }> {
  // Pre-registered file placeholder for MCP actual integration
  // When MCP tools load, this bridges to mcp_insforge_upload_file
  const form = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType });
  form.append("file", blob, filename);

  const res = await fetch(`${BASE}/api/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}` },
    body: form,
  });

  if (!res.ok) throw new Error(`Upload failed ${res.status}`);
  return res.json();
}

export async function createThread(title?: string) {
  return insforge("/api/threads", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function sendMessage(threadId: string, content: string, fileIds?: string[]) {
  return insforge(`/api/threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, file_ids: fileIds ?? [] }),
  });
}

export async function listMessages(threadId: string) {
  return insforge(`/api/threads/${threadId}/messages`);
}

export async function listFiles() {
  return insforge("/api/files");
}
