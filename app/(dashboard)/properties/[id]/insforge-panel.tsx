"use client";

import { useState, useEffect, useCallback } from "react";

interface InsForgeFile {
  id: string;
  name: string;
  url?: string;
  status: string;
  createdAt: Date;
}

interface ChatThread {
  id: string;
  title?: string;
  createdAt: Date;
}

export default function InsForgePanel({ propertyId }: { propertyId: string }) {
  const [files, setFiles] = useState<InsForgeFile[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const refreshFiles = useCallback(async () => {
    const res = await fetch(`/api/properties/${propertyId}/files`);
    if (res.ok) setFiles(await res.json());
  }, [propertyId]);

  const refreshThreads = useCallback(async () => {
    const res = await fetch(`/api/properties/${propertyId}/threads`);
    if (res.ok) setThreads(await res.json());
  }, [propertyId]);

  useEffect(() => {
    refreshFiles();
    refreshThreads();
  }, [refreshFiles, refreshThreads]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/properties/${propertyId}/files`, {
      method: "POST",
      body: form,
    });
    setUploading(false);
    if (res.ok) refreshFiles();
  }

  async function createThread() {
    const res = await fetch(`/api/properties/${propertyId}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nueva conversación" }),
    });
    if (res.ok) {
      const data = await res.json();
      refreshThreads();
      setSelectedThread(data.threadId);
    }
  }

  async function sendChat() {
    if (!selectedThread || !chatInput.trim()) return;
    const content = chatInput.trim();
    setChatInput("");
    setMessages((prev) => [...prev, { role: "user", content }]);

    const res = await fetch(`/api/properties/${propertyId}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      const data = await res.json();
      // Simulated response (replace when MCP tools are active)
      setMessages((prev) => [...prev, { role: "assistant", content: "Respuesta de InsForge (placeholder hasta que MCP cargue)." }]);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="text-lg font-semibold mb-3">Documentos en InsForge</h3>
        <div className="flex flex-col gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer rounded border px-4 py-2 hover:bg-[#E8DCC4]/30 w-fit">
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            <span>{uploading ? "Subiendo..." : "+ Subir documento"}</span>
          </label>

          {files.length === 0 ? (
            <p className="text-sm text-[#6B5E4E]">No hay documentos subidos.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {files.map((f) => (
                <li key={f.id} className="flex items-center gap-3 border rounded px-3 py-2">
                  <span className="text-sm font-medium">{f.name}</span>
                  <span className="text-xs text-[#6B5E4E]">{f.status}</span>
                  {f.url && (
                    <a href={f.url} target="_blank" className="text-xs text-[#4A6E47] underline ml-auto">
                      Ver
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Conversaciones</h3>
          <button onClick={createThread} className="text-sm rounded bg-[#4A6E47] px-3 py-1 text-white">
            + Nueva
          </button>
        </div>

        {!selectedThread ? (
          <div className="flex flex-col gap-2">
            {threads.length === 0 ? (
              <p className="text-sm text-[#6B5E4E]">No hay conversaciones. Crea una para empezar.</p>
            ) : (
              threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedThread(t.id)}
                  className="text-left rounded border px-3 py-2 hover:bg-[#E8DCC4]/30"
                >
                  <div className="text-sm font-medium">{t.title || "Conversación sin título"}</div>
                  <div className="text-xs text-[#6B5E4E]">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="border rounded p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Chat</span>
              <button onClick={() => setSelectedThread(null)} className="text-xs text-[#6B5E4E]">← Volver</button>
            </div>

            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`text-sm px-3 py-2 rounded ${
                    m.role === "user" ? "bg-gray-100 self-end" : "bg-green-50 self-start"
                  }`}
                >
                  {m.content}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Escribe un mensaje..."
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
              <button
                onClick={sendChat}
                className="rounded bg-[#4A6E47] px-4 py-2 text-white text-sm"
              >
                Enviar
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
