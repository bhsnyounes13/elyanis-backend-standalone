import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function extensionForContentType(contentType: string): string {
  return MIME_TO_EXT[contentType] ?? "bin";
}

const TTL_MS = 15 * 60 * 1000;
const MAX_BYTES = 21 * 1024 * 1024;

type Ticket = {
  token: string;
  contentType: string;
  key: string;
  expiresAt: number;
};

const tickets = new Map<string, Ticket>();

function pruneTickets(): void {
  const now = Date.now();
  for (const [id, t] of tickets) {
    if (t.expiresAt < now) tickets.delete(id);
  }
}

export function isLocalDiskStorageConfigured(): boolean {
  return Boolean(config.localUploadRoot);
}

function localPublicBase(): string {
  const b = config.localUploadPublicBase.trim();
  if (b) return b.replace(/\/$/, "");
  return `http://127.0.0.1:${config.port}`;
}

export async function createLocalDiskPresignedUpload(
  contentType: string,
  keyPrefix = "properties",
): Promise<{
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}> {
  pruneTickets();
  const root = path.resolve(process.cwd(), config.localUploadRoot);
  const ext = extensionForContentType(contentType);
  const key = `${keyPrefix}/${randomUUID()}.${ext}`;
  const uploadId = randomUUID();
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + TTL_MS;
  tickets.set(uploadId, { token, contentType, key, expiresAt });

  const base = localPublicBase();
  const uploadUrl = `${base}/api/upload-local/${uploadId}?t=${encodeURIComponent(token)}`;
  const publicUrl = `${base}/uploads/${key}`;

  return { uploadUrl, publicUrl, key, expiresIn: TTL_MS / 1000 };
}

export async function saveLocalDiskUpload(
  uploadId: string,
  token: string | undefined,
  contentTypeHeader: string | undefined,
  body: Buffer,
): Promise<void> {
  pruneTickets();
  if (!token) throw new Error("MISSING_TOKEN");
  const ticket = tickets.get(uploadId);
  if (!ticket || ticket.expiresAt < Date.now()) {
    tickets.delete(uploadId);
    throw new Error("INVALID_OR_EXPIRED_TICKET");
  }

  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(ticket.token, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("INVALID_OR_EXPIRED_TICKET");
  }

  const ct = (contentTypeHeader ?? "").split(";")[0]?.trim() ?? "";
  if (ct !== ticket.contentType) {
    throw new Error("CONTENT_TYPE_MISMATCH");
  }

  if (body.length > MAX_BYTES) throw new Error("BODY_TOO_LARGE");
  if (body.length === 0) throw new Error("EMPTY_BODY");

  const root = path.resolve(process.cwd(), config.localUploadRoot);
  const fullPath = path.resolve(path.join(root, ticket.key));
  const dir = path.dirname(fullPath);
  const rel = path.relative(root, fullPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) throw new Error("PATH_ESCAPE");

  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, body);
  tickets.delete(uploadId);
}
