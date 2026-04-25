import type { Request, Response } from "express";
import { HttpError } from "../errors/http-error.js";
import { saveLocalDiskUpload } from "../services/storage-local.service.js";
import { createPresignedImageUpload, isUploadStorageAvailable } from "../services/storage.service.js";
import { presignUploadBodySchema } from "../validators/schemas.js";

export async function presignPropertyImage(req: Request, res: Response): Promise<void> {
  if (!isUploadStorageAvailable()) {
    throw new HttpError(
      503,
      "Stockage non configuré. En local : définissez STORAGE_LOCAL_ROOT (dossier sur disque), ou configurez S3/R2 (STORAGE_BUCKET, clés API, STORAGE_PUBLIC_URL).",
      { code: "STORAGE_NOT_CONFIGURED" },
    );
  }

  const parsed = presignUploadBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Données invalides.", {
      details: parsed.error.flatten(),
      code: "VALIDATION_ERROR",
    });
  }

  const result = await createPresignedImageUpload(parsed.data.contentType, "properties");
  res.json(result);
}

export async function receiveLocalPropertyImage(req: Request, res: Response): Promise<void> {
  const uploadId = req.params.uploadId ?? "";
  const token = typeof req.query.t === "string" ? req.query.t : undefined;
  const raw = req.body;
  const body = Buffer.isBuffer(raw) ? raw : Buffer.from(raw ?? []);

  try {
    await saveLocalDiskUpload(uploadId, token, req.headers["content-type"], body);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "MISSING_TOKEN" || msg === "INVALID_OR_EXPIRED_TICKET") {
      throw new HttpError(403, "Jeton d’upload invalide ou expiré.", { code: "UPLOAD_TOKEN_INVALID" });
    }
    if (msg === "CONTENT_TYPE_MISMATCH") {
      throw new HttpError(400, "Content-Type incompatible avec l’upload demandé.", {
        code: "UPLOAD_CONTENT_TYPE",
      });
    }
    if (msg === "EMPTY_BODY") {
      throw new HttpError(400, "Corps de requête vide.", { code: "UPLOAD_EMPTY" });
    }
    if (msg === "BODY_TOO_LARGE") {
      throw new HttpError(413, "Fichier trop volumineux.", { code: "UPLOAD_TOO_LARGE" });
    }
    if (msg === "PATH_ESCAPE") {
      throw new HttpError(500, "Chemin de stockage invalide.", { code: "UPLOAD_PATH" });
    }
    throw e;
  }

  res.status(204).send();
}
