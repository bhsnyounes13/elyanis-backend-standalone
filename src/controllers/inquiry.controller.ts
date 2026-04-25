import type { Request, Response } from "express";
import * as inquiryService from "../services/inquiry.service.js";
import {
  contactPublicSchema,
  propertyInquiryPublicSchema,
} from "../validators/schemas.js";
import { HttpError } from "../errors/http-error.js";
import {
  contactSubmissionToJson,
  propertyInquiryToJson,
} from "../utils/serialization.js";
import { assertTurnstileIfRequired } from "../utils/form-security.js";

export async function submitContact(req: Request, res: Response): Promise<void> {
  const parsed = contactPublicSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Données invalides.", {
      details: parsed.error.flatten(),
      code: "VALIDATION_ERROR",
    });
  }
  const { turnstileToken, ...fields } = parsed.data;
  await assertTurnstileIfRequired(turnstileToken, req);

  const row = await inquiryService.createContactSubmission(fields);
  res.status(201).json({ ok: true, id: row.id, submission: contactSubmissionToJson(row) });
}

export async function submitPropertyInquiry(req: Request, res: Response): Promise<void> {
  const parsed = propertyInquiryPublicSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Données invalides.", {
      details: parsed.error.flatten(),
      code: "VALIDATION_ERROR",
    });
  }
  const { turnstileToken, ...fields } = parsed.data;
  await assertTurnstileIfRequired(turnstileToken, req);

  const row = await inquiryService.createPropertyInquiry({
    propertyId: fields.propertyId,
    name: fields.name,
    email: fields.email,
    phone: fields.phone,
    message: fields.message,
    preferredDate: fields.preferredDate,
  });
  res.status(201).json({ ok: true, id: row.id, inquiry: propertyInquiryToJson(row) });
}
