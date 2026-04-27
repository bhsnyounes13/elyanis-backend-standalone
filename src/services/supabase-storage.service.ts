import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "./supabase.service.js";
import { config } from "../config.js";
import {
  extensionForImageContentType,
  type SupportedImageContentType,
} from "../utils/image-content-type.js";

export interface PresignedUploadResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

/**
 * Create a presigned upload URL for Supabase Storage
 */
export async function createPresignedImageUpload(
  contentType: SupportedImageContentType,
  keyPrefix = "properties",
): Promise<PresignedUploadResult> {
  const bucket = config.supabase.storageBucket;
  const ext = extensionForImageContentType(contentType);
  const key = `${keyPrefix}/${randomUUID()}.${ext}`;
  const expiresIn = 15 * 60; // 15 minutes

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(key, { upsert: false });

    if (error) throw new Error(`Upload URL generation failed: ${error.message}`);
    if (!data) throw new Error("No signed URL returned");

    // Build public URL for accessing the file
    const publicUrl = `${config.supabase.projectUrl}/storage/v1/object/public/${bucket}/${key}`;

    return {
      uploadUrl: data.signedUrl,
      publicUrl,
      key,
      expiresIn,
    };
  } catch (e) {
    throw new Error(`Failed to create presigned upload URL: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteImageFromStorage(fileKey: string): Promise<void> {
  const bucket = config.supabase.storageBucket;

  const { error } = await supabaseAdmin.storage.from(bucket).remove([fileKey]);

  if (error) throw new Error(`File deletion failed: ${error.message}`);
}

/**
 * Get public URL for a file in Supabase Storage
 */
export function getPublicImageUrl(fileKey: string): string {
  const bucket = config.supabase.storageBucket;
  return `${config.supabase.projectUrl}/storage/v1/object/public/${bucket}/${fileKey}`;
}
