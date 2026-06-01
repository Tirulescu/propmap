export const PROPMAP_FILES_BUCKET = "propmap-files";

export function storageKeyFromPropmapUrl(url: string): string | null {
  const marker = `/api/storage/buckets/${PROPMAP_FILES_BUCKET}/objects/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export function contentDispositionInline(filename: string): string {
  const fallback = filename.replace(/[^\x20-\x7E]+|[\r\n"]/g, "_") || "documento";
  return `inline; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
