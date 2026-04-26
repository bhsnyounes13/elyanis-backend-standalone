import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import {
  createLocalDiskPresignedUpload,
  isLocalDiskStorageConfigured,
} from "./storage-local.service.js";
import { extensionForImageContentType, type SupportedImageContentType } from "../utils/image-content-type.js";

let s3Client: S3Client | null = null;

type StorageRequiredVar =
  | "STORAGE_BUCKET"
  | "STORAGE_ACCESS_KEY_ID"
  | "STORAGE_SECRET_ACCESS_KEY"
  | "STORAGE_PUBLIC_URL";

export type StorageStatus = {
  objectStorageConfigured: boolean;
  localStorageConfigured: boolean;
  bucketLoaded: boolean;
  endpointLoaded: boolean;
  accessKeyLoaded: boolean;
  secretKeyLoaded: boolean;
  publicUrlLoaded: boolean;
  forcePathStyle: boolean;
};

function hasValue(value: string): boolean {
  return value.trim().length > 0;
}

function buildPublicObjectUrl(base: string, key: string): string {
  const cleanBase = base.replace(/\/+$/, "");
  const cleanKey = key.replace(/^\/+/, "");
  return `${cleanBase}/${cleanKey}`;
}

export function getMissingObjectStorageVariables(): StorageRequiredVar[] {
  const s = config.storage;
  const missing: StorageRequiredVar[] = [];
  if (!hasValue(s.bucket)) missing.push("STORAGE_BUCKET");
  if (!hasValue(s.accessKeyId)) missing.push("STORAGE_ACCESS_KEY_ID");
  if (!hasValue(s.secretAccessKey)) missing.push("STORAGE_SECRET_ACCESS_KEY");
  if (!hasValue(s.publicUrl)) missing.push("STORAGE_PUBLIC_URL");
  return missing;
}

export function isObjectStorageConfigured(): boolean {
  return getMissingObjectStorageVariables().length === 0;
}

/** S3/R2 complet, ou dossier local `STORAGE_LOCAL_ROOT`. */
export function isUploadStorageAvailable(): boolean {
  return isObjectStorageConfigured() || isLocalDiskStorageConfigured();
}

export function getStorageStatus(): StorageStatus {
  const s = config.storage;
  return {
    objectStorageConfigured: isObjectStorageConfigured(),
    localStorageConfigured: isLocalDiskStorageConfigured(),
    bucketLoaded: hasValue(s.bucket),
    endpointLoaded: hasValue(s.endpoint),
    accessKeyLoaded: hasValue(s.accessKeyId),
    secretKeyLoaded: hasValue(s.secretAccessKey),
    publicUrlLoaded: hasValue(s.publicUrl),
    forcePathStyle: s.forcePathStyle || hasValue(s.endpoint),
  };
}

function getS3Client(): S3Client | null {
  const s = config.storage;
  if (!s.bucket || !s.accessKeyId || !s.secretAccessKey) return null;

  if (!s3Client) {
    s3Client = new S3Client({
      region: s.region,
      endpoint: s.endpoint || undefined,
      credentials: {
        accessKeyId: s.accessKeyId,
        secretAccessKey: s.secretAccessKey,
      },
      forcePathStyle: s.forcePathStyle || Boolean(s.endpoint),
    });
  }
  return s3Client;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

/**
 * Génère une URL PUT présignée ; le client envoie le fichier binaire directement au bucket.
 */
export async function createPresignedImageUpload(
  contentType: SupportedImageContentType,
  keyPrefix = "properties",
): Promise<PresignedUploadResult> {
  if (isObjectStorageConfigured()) {
    const client = getS3Client();
    if (!client) throw new Error("STORAGE_NOT_CONFIGURED");

    const ext = extensionForImageContentType(contentType);
    const key = `${keyPrefix}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
      ContentType: contentType,
    });

    const expiresIn = 15 * 60;
    const uploadUrl = await getSignedUrl(client, command, { expiresIn });

    const publicUrl = buildPublicObjectUrl(config.storage.publicUrl, key);

    return { uploadUrl, publicUrl, key, expiresIn };
  }

  if (isLocalDiskStorageConfigured()) {
    return createLocalDiskPresignedUpload(contentType, keyPrefix);
  }

  throw new Error("STORAGE_NOT_CONFIGURED");
}
