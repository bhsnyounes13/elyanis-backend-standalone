import type {
  Agent,
  Property,
  SiteService as SiteServiceRow,
  ContactSubmission,
  PropertyInquiry,
} from "@prisma/client";

/** Format aligné avec `PropertyApiDto` du frontend */
export function propertyToJson(p: Property): Record<string, unknown> {
  const booked = p.bookedDates as unknown as { from: string; to: string }[] | null;
  const tags = p.tags as unknown as string[] | null;
  return {
    id: p.id,
    title_en: p.titleEn,
    title_fr: p.titleFr,
    title_ar: p.titleAr,
    description_en: p.descriptionEn,
    description_fr: p.descriptionFr,
    description_ar: p.descriptionAr,
    type: p.type,
    price: p.price,
    city: p.city,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area: p.area,
    images: p.images as unknown as string[],
    amenities: p.amenities as unknown as string[],
    agent_id: p.agentId,
    agentId: p.agentId,
    booked_dates: booked ?? undefined,
    bookedDates: booked ?? undefined,
    featured: p.featured,
    tags: tags ?? undefined,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  };
}

export function agentToJson(a: Agent): Record<string, unknown> {
  return {
    id: a.id,
    name: a.name,
    photo: a.photo,
    phone: a.phone,
    email: a.email,
    bio_en: a.bioEn,
    bio_fr: a.bioFr,
    bio_ar: a.bioAr,
    created_at: a.createdAt.toISOString(),
    updated_at: a.updatedAt.toISOString(),
  };
}

export function siteServiceToJson(s: SiteServiceRow): Record<string, unknown> {
  return {
    id: s.id,
    title_en: s.titleEn,
    title_fr: s.titleFr,
    title_ar: s.titleAr,
    description_en: s.descriptionEn,
    description_fr: s.descriptionFr,
    description_ar: s.descriptionAr,
    icon_key: s.iconKey,
    iconKey: s.iconKey,
    created_at: s.createdAt.toISOString(),
    updated_at: s.updatedAt.toISOString(),
  };
}

export function contactSubmissionToJson(c: ContactSubmission): Record<string, unknown> {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    subject: c.subject,
    message: c.message,
    created_at: c.createdAt.toISOString(),
  };
}

export function propertyInquiryToJson(i: PropertyInquiry): Record<string, unknown> {
  return {
    id: i.id,
    property_id: i.propertyId,
    propertyId: i.propertyId,
    name: i.name,
    email: i.email,
    phone: i.phone,
    message: i.message,
    preferred_date: i.preferredDate,
    preferredDate: i.preferredDate,
    created_at: i.createdAt.toISOString(),
  };
}
