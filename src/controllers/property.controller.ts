import type { Request, Response } from "express";
import * as propertyService from "../services/property.service.js";
import {
  createPropertySchema,
  listPropertyQuerySchema,
  updatePropertySchema,
} from "../validators/schemas.js";
import { HttpError } from "../errors/http-error.js";
import { propertyToJson } from "../utils/serialization.js";

export async function list(req: Request, res: Response): Promise<void> {
  const parsed = listPropertyQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid query", { details: parsed.error.flatten() });
  }
  const rows = await propertyService.listProperties(parsed.data);
  res.json(rows.map((p) => propertyToJson(p)));
}

export async function featured(_req: Request, res: Response): Promise<void> {
  const rows = await propertyService.listFeaturedProperties();
  res.json(rows.map((p) => propertyToJson(p)));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const p = await propertyService.getPropertyById(req.params.id);
  res.json(propertyToJson(p));
}

export async function create(req: Request, res: Response): Promise<void> {
  const parsed = createPropertySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid body", { details: parsed.error.flatten() });
  }
  const d = parsed.data;
  const row = await propertyService.createProperty({
    titleEn: d.title_en,
    titleFr: d.title_fr,
    titleAr: d.title_ar,
    descriptionEn: d.description_en,
    descriptionFr: d.description_fr,
    descriptionAr: d.description_ar,
    type: d.type,
    price: d.price,
    city: d.city,
    bedrooms: d.bedrooms,
    bathrooms: d.bathrooms,
    area: d.area,
    images: d.images,
    amenities: d.amenities,
    bookedDates: d.bookedDates ?? null,
    featured: d.featured ?? false,
    tags: d.tags ?? null,
    agentId: d.agent_id,
  });
  res.status(201).json(propertyToJson(row));
}

export async function update(req: Request, res: Response): Promise<void> {
  const parsed = updatePropertySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid body", { details: parsed.error.flatten() });
  }
  const d = parsed.data;
  const patch: Parameters<typeof propertyService.updateProperty>[1] = {};
  if (d.title_en !== undefined) patch.titleEn = d.title_en;
  if (d.title_fr !== undefined) patch.titleFr = d.title_fr;
  if (d.title_ar !== undefined) patch.titleAr = d.title_ar;
  if (d.description_en !== undefined) patch.descriptionEn = d.description_en;
  if (d.description_fr !== undefined) patch.descriptionFr = d.description_fr;
  if (d.description_ar !== undefined) patch.descriptionAr = d.description_ar;
  if (d.type !== undefined) patch.type = d.type;
  if (d.price !== undefined) patch.price = d.price;
  if (d.city !== undefined) patch.city = d.city;
  if (d.bedrooms !== undefined) patch.bedrooms = d.bedrooms;
  if (d.bathrooms !== undefined) patch.bathrooms = d.bathrooms;
  if (d.area !== undefined) patch.area = d.area;
  if (d.images !== undefined) patch.images = d.images;
  if (d.amenities !== undefined) patch.amenities = d.amenities;
  if (d.bookedDates !== undefined) patch.bookedDates = d.bookedDates;
  if (d.featured !== undefined) patch.featured = d.featured;
  if (d.tags !== undefined) patch.tags = d.tags;
  if (d.agent_id !== undefined) patch.agentId = d.agent_id;

  const row = await propertyService.updateProperty(req.params.id, patch);
  res.json(propertyToJson(row));
}

export async function remove(req: Request, res: Response): Promise<void> {
  await propertyService.deleteProperty(req.params.id);
  res.status(204).send();
}
