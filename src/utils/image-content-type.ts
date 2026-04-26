export const SUPPORTED_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const;

export const IMAGE_CONTENT_TYPE_ALIASES: Readonly<Record<string, (typeof SUPPORTED_IMAGE_CONTENT_TYPES)[number]>> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
};

const SUPPORTED_IMAGE_CONTENT_TYPE_SET = new Set<string>(SUPPORTED_IMAGE_CONTENT_TYPES);

const IMAGE_CONTENT_TYPE_TO_EXTENSION: Readonly<Record<(typeof SUPPORTED_IMAGE_CONTENT_TYPES)[number], string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
};

export type SupportedImageContentType = (typeof SUPPORTED_IMAGE_CONTENT_TYPES)[number];

export function normalizeImageContentType(value: string): SupportedImageContentType | null {
  const raw = value.split(";")[0]?.trim().toLowerCase() ?? "";
  const canonical = IMAGE_CONTENT_TYPE_ALIASES[raw] ?? raw;
  return SUPPORTED_IMAGE_CONTENT_TYPE_SET.has(canonical) ? (canonical as SupportedImageContentType) : null;
}

export function extensionForImageContentType(contentType: SupportedImageContentType): string {
  return IMAGE_CONTENT_TYPE_TO_EXTENSION[contentType];
}
