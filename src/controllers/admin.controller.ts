import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import * as inquiryService from "../services/inquiry.service.js";
import { HttpError } from "../errors/http-error.js";

/** Vue synthétique pour le tableau de bord admin (données réelles). */
export async function dashboard(_req: Request, res: Response): Promise<void> {
  const [
    userCount,
    adminCount,
    propertyCount,
    contactSubmissionCount,
    propertyInquiryCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.property.count(),
    prisma.contactSubmission.count(),
    prisma.propertyInquiry.count(),
  ]);

  res.json({
    stats: {
      users: userCount,
      admins: adminCount,
      properties: propertyCount,
      contactSubmissions: contactSubmissionCount,
      propertyInquiries: propertyInquiryCount,
    },
  });
}

/** Liste unifiée des demandes formulaire contact + demandes bien (pour le CRM admin). */
export async function listInquiries(_req: Request, res: Response): Promise<void> {
  const [contacts, inquiries] = await Promise.all([
    inquiryService.listContactSubmissionsForAdmin(),
    inquiryService.listPropertyInquiriesForAdmin(),
  ]);

  const items = [
    ...contacts.map((c) => ({
      kind: "contact" as const,
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone ?? undefined,
      subject: c.subject ?? undefined,
      message: c.message,
      created_at: c.createdAt.toISOString(),
    })),
    ...inquiries.map((i) => ({
      kind: "property" as const,
      id: i.id,
      property_id: i.propertyId,
      property_title_fr: i.property.titleFr,
      name: i.name,
      email: i.email,
      phone: i.phone ?? undefined,
      message: i.message,
      preferred_date: i.preferredDate ?? undefined,
      created_at: i.createdAt.toISOString(),
    })),
  ];

  items.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  res.json({ items });
}

export async function deleteContactSubmission(req: Request, res: Response): Promise<void> {
  const ok = await inquiryService.deleteContactSubmission(req.params.id);
  if (!ok) throw new HttpError(404, "Not found");
  res.status(204).send();
}

export async function deletePropertyInquiry(req: Request, res: Response): Promise<void> {
  const ok = await inquiryService.deletePropertyInquiry(req.params.id);
  if (!ok) throw new HttpError(404, "Not found");
  res.status(204).send();
}
