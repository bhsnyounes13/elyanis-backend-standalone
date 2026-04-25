import { CityKey, PropertyType } from "@prisma/client";
import { z } from "zod";

const cityKeySchema = z.nativeEnum(CityKey);
const propertyTypeSchema = z.nativeEnum(PropertyType);

const noHtmlPattern = (s: string) => !/<\s*script|on\w+\s*=/i.test(s);

/** Login / register + jeton Turnstile (jamais stocké, vérifié côté serveur). */
export const authBodyPublicSchema = z
  .object({
    email: z.preprocess(
      (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
      z.string().email().max(320),
    ),
    password: z.string().min(8).max(128),
    turnstileToken: z.string().min(1).max(4000).optional(),
  })
  .strict();

export const createPropertySchema = z.object({
  title_en: z.string().min(1).max(500),
  title_fr: z.string().min(1).max(500),
  title_ar: z.string().min(1).max(500),
  description_en: z.string().min(1).max(20000),
  description_fr: z.string().min(1).max(20000),
  description_ar: z.string().min(1).max(20000),
  type: propertyTypeSchema,
  price: z.number().int().positive(),
  city: cityKeySchema,
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  area: z.number().positive(),
  images: z.array(z.string().min(1)).min(1),
  amenities: z.array(z.string().min(1)),
  bookedDates: z
    .array(
      z.object({
        from: z.string(),
        to: z.string(),
      }),
    )
    .optional(),
  featured: z.boolean().optional(),
  tags: z.array(z.enum(["exclusive", "new", "featured"])).optional(),
  agent_id: z.string().uuid(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const createAgentSchema = z.object({
  name: z.string().min(1).max(200),
  photo: z.string().min(1),
  phone: z.string().min(5).max(80),
  email: z.string().email().max(320),
  bio_en: z.string().min(1).max(10000),
  bio_fr: z.string().min(1).max(10000),
  bio_ar: z.string().min(1).max(10000),
});

export const updateAgentSchema = createAgentSchema.partial();

export const createSiteServiceSchema = z.object({
  title_en: z.string().min(1).max(300),
  title_fr: z.string().min(1).max(300),
  title_ar: z.string().min(1).max(300),
  description_en: z.string().min(1).max(20000),
  description_fr: z.string().min(1).max(20000),
  description_ar: z.string().min(1).max(20000),
  icon_key: z.string().min(1).max(80),
});

export const updateSiteServiceSchema = createSiteServiceSchema.partial();

const contactFieldsSchema = z
  .object({
    name: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z.string().min(2).max(200),
    ),
    email: z.preprocess(
      (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
      z.string().email().max(320),
    ),
    phone: z.preprocess(
      (v) => (typeof v === "string" && v.trim() !== "" ? v.trim().slice(0, 80) : undefined),
      z.string().max(80).optional(),
    ),
    subject: z.preprocess(
      (v) => (typeof v === "string" && v.trim() !== "" ? v.trim().slice(0, 300) : undefined),
      z.string().min(2).max(300).optional(),
    ),
    message: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z.string().min(4).max(10000),
    ),
  })
  .strict();

export const contactBodySchema = contactFieldsSchema.refine(
  (d) =>
    noHtmlPattern(d.name) &&
    noHtmlPattern(d.message) &&
    (d.subject == null || noHtmlPattern(d.subject)),
  { message: "Contenu non autorisé (balises ou scripts)." },
);

const propertyInquiryFieldsSchema = z
  .object({
    name: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z.string().min(2).max(200),
    ),
    email: z.preprocess(
      (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
      z.string().email().max(320),
    ),
    phone: z.preprocess(
      (v) => (typeof v === "string" && v.trim() !== "" ? v.trim().slice(0, 80) : undefined),
      z.string().max(80).optional(),
    ),
    message: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z.string().min(4).max(10000),
    ),
    propertyId: z.string().uuid(),
    preferredDate: z.preprocess(
      (v) => (typeof v === "string" && v.trim() !== "" ? v.trim().slice(0, 80) : undefined),
      z.string().max(80).optional(),
    ),
  })
  .strict();

export const propertyInquiryBodySchema = propertyInquiryFieldsSchema.refine(
  (d) => noHtmlPattern(d.name) && noHtmlPattern(d.message),
  { message: "Contenu non autorisé (balises ou scripts)." },
);

/** Corps HTTP entrant ; le jeton Turnstile est retiré avant persistance. */
export const contactPublicSchema = contactFieldsSchema
  .extend({
    turnstileToken: z.string().max(4000).optional(),
  })
  .strict()
  .refine(
    (d) =>
      noHtmlPattern(d.name) &&
      noHtmlPattern(d.message) &&
      (d.subject == null || noHtmlPattern(d.subject)),
    { message: "Contenu non autorisé (balises ou scripts)." },
  );

export const propertyInquiryPublicSchema = propertyInquiryFieldsSchema
  .extend({
    turnstileToken: z.string().max(4000).optional(),
  })
  .strict()
  .refine((d) => noHtmlPattern(d.name) && noHtmlPattern(d.message), {
    message: "Contenu non autorisé (balises ou scripts).",
  });

export const presignUploadBodySchema = z
  .object({
    contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  })
  .strict();

/** Mise à jour du rôle utilisateur (admin uniquement, logique métier dans le contrôleur). */
export const adminUpdateUserRoleSchema = z
  .object({
    role: z.enum(["admin", "user"]),
  })
  .strict();

export const listPropertyQuerySchema = z.object({
  city: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : v),
    cityKeySchema.optional(),
  ),
  type: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : v),
    propertyTypeSchema.optional(),
  ),
  featured: z.preprocess((v) => {
    if (v === undefined || v === "") return undefined;
    return v === "true" || v === true;
  }, z.boolean().optional()),
  q: z.preprocess((v) => (typeof v === "string" ? v : undefined), z.string().max(200).optional()),
});
