import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { supabaseAdmin } from "./supabase.service.js";
import {
  createLocalDiskPresignedUpload,
  isLocalDiskStorageConfigured,
} from "./storage-local.service.js";
import { extensionForImageContentType, type SupportedImageContentType } from "../utils/image-content-type.js";

type StorageRequiredVar = "SUPABASE_PROJECT_URL" | "SUPABASE_ANON_KEY" | "SUPABASE_SERVICE_ROLE_KEY";

export type StorageStatus = {
  supabaseConfigured: boolean;
  localStorageConfigured: boolean;
};

function hasValue(value: string): boolean {
  return value.trim().length > 0;
}

export function getMissingSupabaseVariables(): StorageRequiredVar[] {
  const s = config.supabase;
  const missing: StorageRequiredVar[] = [];
  if (!hasValue(s.projectUrl)) missing.push("SUPABASE_PROJECT_URL");
  if (!hasValue(s.anonKey)) missing.push("SUPABASE_ANON_KEY");
  if (!hasValue(s.serviceRoleKey)) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return missing;
}

export function isSupabaseStorageConfigured(): boolean {
  return getMissingSupabaseVariables().length === 0;
}

export function isUploadStorageAvailable(): boolean {
  return isSupabaseStorageConfigured() || isLocalDiskStorageConfigured();
}

export function getStorageStatus(): StorageStatus {
  return {
    supabaseConfigured: isSupabaseStorageConfigured(),
    localStorageConfigured: isLocalDiskStorageConfigured(),
  };
}

export interface PresignedUploadResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

/**
 * Create presigned upload URL for images (Supabase or local disk fallback)
 */
export async function createPresignedImageUpload(
  contentType: SupportedImageContentType,
  keyPrefix = "properties",
): Promise<PresignedUploadResult> {
  if (isSupabaseStorageConfigured()) {
    const bucket = config.supabase.storageBucket;
    const ext = extensionForImageContentType(contentType);
    const key = `${keyPrefix}/${randomUUID()}.${ext}`;
    const expiresIn = 15 * 60;

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(key, { upsert: false });

    if (error) throw new Error(`STORAGE_ERROR: ${error.message}`);
    if (!data) throw new Error("STORAGE_ERROR: No signed URL returned");

    const publicUrl = `${config.supabase.projectUrl}/storage/v1/object/public/${bucket}/${key}`;

    return {
      uploadUrl: data.signedUrl,
      publicUrl,
      key,
      expiresIn,
    };
  }

  if (isLocalDiskStorageConfigured()) {
    return createLocalDiskPresignedUpload(contentType, keyPrefix);
  }

  throw new Error("STORAGE_NOT_CONFIGURED");
}
