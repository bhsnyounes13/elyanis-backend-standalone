import type { Request, Response } from "express";
import * as catalogService from "../services/catalog.service.js";
import { createSiteServiceSchema, updateSiteServiceSchema } from "../validators/schemas.js";
import { HttpError } from "../errors/http-error.js";
import { siteServiceToJson } from "../utils/serialization.js";

export async function list(_req: Request, res: Response): Promise<void> {
  const rows = await catalogService.listSiteServices();
  res.json(rows.map((s) => siteServiceToJson(s)));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const s = await catalogService.getSiteServiceById(req.params.id);
  res.json(siteServiceToJson(s));
}

export async function create(req: Request, res: Response): Promise<void> {
  const parsed = createSiteServiceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid body", { details: parsed.error.flatten() });
  }
  const d = parsed.data;
  const row = await catalogService.createSiteService({
    titleEn: d.title_en,
    titleFr: d.title_fr,
    titleAr: d.title_ar,
    descriptionEn: d.description_en,
    descriptionFr: d.description_fr,
    descriptionAr: d.description_ar,
    iconKey: d.icon_key,
  });
  res.status(201).json(siteServiceToJson(row));
}

export async function update(req: Request, res: Response): Promise<void> {
  const parsed = updateSiteServiceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid body", { details: parsed.error.flatten() });
  }
  const d = parsed.data;
  const patch: Parameters<typeof catalogService.updateSiteService>[1] = {};
  if (d.title_en !== undefined) patch.titleEn = d.title_en;
  if (d.title_fr !== undefined) patch.titleFr = d.title_fr;
  if (d.title_ar !== undefined) patch.titleAr = d.title_ar;
  if (d.description_en !== undefined) patch.descriptionEn = d.description_en;
  if (d.description_fr !== undefined) patch.descriptionFr = d.description_fr;
  if (d.description_ar !== undefined) patch.descriptionAr = d.description_ar;
  if (d.icon_key !== undefined) patch.iconKey = d.icon_key;

  const row = await catalogService.updateSiteService(req.params.id, patch);
  res.json(siteServiceToJson(row));
}

export async function remove(req: Request, res: Response): Promise<void> {
  await catalogService.deleteSiteService(req.params.id);
  res.status(204).send();
}
