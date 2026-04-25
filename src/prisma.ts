import { PrismaClient } from "@prisma/client";

declare global {
  var __elyPrisma: PrismaClient | undefined;
}

/** Instance unique du client Prisma (évite reconnexion en hot-reload). */
export const prisma = globalThis.__elyPrisma ?? new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") {
  globalThis.__elyPrisma = prisma;
}
