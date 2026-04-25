import type { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

/** Connexion PostgreSQL avant de lancer Express — évite un serveur qui écoute sans base. */

function describePrismaDbError(err: unknown): string[] {
  const msg = err instanceof Error ? err.message : String(err);
  const lines = [
    "PostgreSQL is not running or not accessible on localhost:5432",
    "(or DATABASE_URL is wrong — user, password, host, port, database name).",
    "",
    "Fix:",
    "  • Start PostgreSQL on this machine and ensure DATABASE_URL in `.env` is correct (see `.env.example`).",
    "  • Create the database if it does not exist, then: npm run db:setup",
    "  • If you use Docker for Postgres: npm run db:setup:docker",
    "",
    `Technical detail: ${msg}`,
  ];
  return lines;
}

function connectTimeoutMs(): number {
  const raw = process.env.DB_CONNECT_TIMEOUT_MS?.trim();
  const n = raw ? Number(raw) : NaN;
  if (Number.isFinite(n) && n > 0) return Math.min(Math.floor(n), 120_000);
  return 30_000;
}

export async function verifyDatabase(prisma: PrismaClient): Promise<void> {
  const ms = connectTimeoutMs();
  try {
    await Promise.race([
      (async () => {
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
      })(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `Database connection timed out after ${ms}ms (check DATABASE_URL, network, SSL).`,
            ),
          );
        }, ms);
      }),
    ]);
  } catch (err) {
    logger.error({ err }, "database_unreachable");
    const banner = "═".repeat(64);
    const body = [
      "",
      banner,
      "  DATABASE UNAVAILABLE — API will not start",
      banner,
      "",
      ...describePrismaDbError(err).map((l) => `  ${l}`),
      "",
      "  See `.env.example` for DATABASE_URL.",
      banner,
      "",
    ].join("\n");
    throw new Error(body);
  }
}
