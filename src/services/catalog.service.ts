import { prisma } from "../prisma.js";
import { HttpError } from "../errors/http-error.js";

export async function listSiteServices() {
  return prisma.siteService.findMany({ orderBy: { titleFr: "asc" } });
}

export async function getSiteServiceById(id: string) {
  const s = await prisma.siteService.findUnique({ where: { id } });
  if (!s) throw new HttpError(404, "Service not found", { code: "SERVICE_NOT_FOUND" });
  return s;
}

export async function createSiteService(data: {
  titleEn: string;
  titleFr: string;
  titleAr: string;
  descriptionEn: string;
  descriptionFr: string;
  descriptionAr: string;
  iconKey: string;
}) {
  return prisma.siteService.create({ data });
}

export async function updateSiteService(
  id: string,
  patch: Partial<{
    titleEn: string;
    titleFr: string;
    titleAr: string;
    descriptionEn: string;
    descriptionFr: string;
    descriptionAr: string;
    iconKey: string;
  }>,
) {
  await getSiteServiceById(id);
  return prisma.siteService.update({ where: { id }, data: patch });
}

export async function deleteSiteService(id: string): Promise<void> {
  await getSiteServiceById(id);
  await prisma.siteService.delete({ where: { id } });
}
