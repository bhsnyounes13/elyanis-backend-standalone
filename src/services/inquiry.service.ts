import { prisma } from "../prisma.js";
import { HttpError } from "../errors/http-error.js";

export async function createContactSubmission(input: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  return prisma.contactSubmission.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      message: input.message,
    },
  });
}

export async function createPropertyInquiry(input: {
  propertyId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  preferredDate?: string;
}) {
  const prop = await prisma.property.findUnique({ where: { id: input.propertyId } });
  if (!prop) {
    throw new HttpError(404, "Property not found", { code: "PROPERTY_NOT_FOUND" });
  }

  return prisma.propertyInquiry.create({
    data: {
      propertyId: input.propertyId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      message: input.message,
      preferredDate: input.preferredDate,
    },
  });
}

export async function listContactSubmissionsForAdmin() {
  return prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function listPropertyInquiriesForAdmin() {
  return prisma.propertyInquiry.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      property: { select: { titleFr: true } },
    },
  });
}

export async function deleteContactSubmission(id: string): Promise<boolean> {
  try {
    await prisma.contactSubmission.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function deletePropertyInquiry(id: string): Promise<boolean> {
  try {
    await prisma.propertyInquiry.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
