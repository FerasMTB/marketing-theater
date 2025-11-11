import { IS_REMOTE } from "./config";
import { http } from "./http";
import { nanoid } from "nanoid";

type Presign = { url: string; fields: Record<string, string>; fileId?: string; publicUrl?: string };

export async function presignUpload(params: { filename: string; type: string; size: number; kind: "doc" | "image"; projectId: string }): Promise<Presign> {
  return http<Presign>(`/uploads/presign`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function uploadToPresignedUrl(p: Presign, file: File): Promise<string | undefined> {
  const form = new FormData();
  Object.entries(p.fields || {}).forEach(([k, v]) => form.append(k, v));
  form.append("file", file);
  const res = await fetch(p.url, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return p.publicUrl;
}

export async function uploadFilesRemote(files: File[], kind: "doc" | "image", projectId: string) {
  if (!IS_REMOTE) return [] as { id: string; name: string; url?: string; type?: string; size?: number }[];
  const out: { id: string; name: string; url?: string; type?: string; size?: number }[] = [];
  for (const f of files) {
    const ps = await presignUpload({ filename: f.name, type: f.type, size: f.size, kind, projectId });
    const publicUrl = await uploadToPresignedUrl(ps, f);
    out.push({ id: ps.fileId || nanoid(12), name: f.name, url: publicUrl, type: f.type, size: f.size });
  }
  return out;
}
