import type { Request, Response } from "express";
import * as agentService from "../services/agent.service.js";
import { createAgentSchema, updateAgentSchema } from "../validators/schemas.js";
import { HttpError } from "../errors/http-error.js";
import { agentToJson } from "../utils/serialization.js";

export async function list(_req: Request, res: Response): Promise<void> {
  const rows = await agentService.listAgents();
  res.json(rows.map((a) => agentToJson(a)));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const a = await agentService.getAgentById(req.params.id);
  res.json(agentToJson(a));
}

export async function create(req: Request, res: Response): Promise<void> {
  const parsed = createAgentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid body", { details: parsed.error.flatten() });
  }
  const d = parsed.data;
  const row = await agentService.createAgent({
    name: d.name,
    photo: d.photo,
    phone: d.phone,
    email: d.email,
    bioEn: d.bio_en,
    bioFr: d.bio_fr,
    bioAr: d.bio_ar,
  });
  res.status(201).json(agentToJson(row));
}

export async function update(req: Request, res: Response): Promise<void> {
  const parsed = updateAgentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid body", { details: parsed.error.flatten() });
  }
  const d = parsed.data;
  const patch: Parameters<typeof agentService.updateAgent>[1] = {};
  if (d.name !== undefined) patch.name = d.name;
  if (d.photo !== undefined) patch.photo = d.photo;
  if (d.phone !== undefined) patch.phone = d.phone;
  if (d.email !== undefined) patch.email = d.email;
  if (d.bio_en !== undefined) patch.bioEn = d.bio_en;
  if (d.bio_fr !== undefined) patch.bioFr = d.bio_fr;
  if (d.bio_ar !== undefined) patch.bioAr = d.bio_ar;

  const row = await agentService.updateAgent(req.params.id, patch);
  res.json(agentToJson(row));
}

export async function remove(req: Request, res: Response): Promise<void> {
  await agentService.deleteAgent(req.params.id);
  res.status(204).send();
}
