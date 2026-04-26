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

export function isObjectStorageConfigured(): boolean {
  const s = config.storage;
  return Boolean(
    s.bucket && s.accessKeyId && s.secretAccessKey && s.publicUrl,
  );
}

/** S3/R2 complet, ou dossier local `STORAGE_LOCAL_ROOT`. */
export function isUploadStorageAvailable(): boolean {
  return isObjectStorageConfigured() || isLocalDiskStorageConfigured();
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
      forcePathStyle: s.forcePathStyle,
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

    const publicUrl = `${config.storage.publicUrl}/${key}`;

    return { uploadUrl, publicUrl, key, expiresIn };
  }

  if (isLocalDiskStorageConfigured()) {
    return createLocalDiskPresignedUpload(contentType, keyPrefix);
  }

  throw new Error("STORAGE_NOT_CONFIGURED");
}
