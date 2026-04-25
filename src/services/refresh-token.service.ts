import crypto from "node:crypto";
import { prisma } from "../prisma.js";
import { config } from "../config.js";

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

export async function createRefreshToken(
  userId: string,
): Promise<{ rawToken: string; expiresAt: Date }> {
  const id = crypto.randomUUID();
  const secret = crypto.randomBytes(32).toString("hex");
  const rawToken = `${id}.${secret}`;
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + config.refreshTokenDays * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      id,
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { rawToken, expiresAt };
}

export async function consumeRefreshToken(rawToken: string): Promise<{ userId: string } | null> {
  const parts = rawToken.split(".");
  if (parts.length !== 2) return null;
  const [id, secret] = parts;
  if (!id || !secret) return null;
  const candidate = `${id}.${secret}`;
  const tokenHash = sha256Hex(candidate);

  const row = await prisma.refreshToken.findFirst({
    where: { id, tokenHash },
  });

  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await prisma.refreshToken.deleteMany({ where: { id } });
    return null;
  }

  await prisma.refreshToken.deleteMany({ where: { id } });
  return { userId: row.userId };
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function revokeByRefreshCookieRaw(rawToken: string): Promise<boolean> {
  const tokenHash = sha256Hex(rawToken);
  const row = await prisma.refreshToken.findFirst({
    where: { tokenHash },
    select: { userId: true },
  });
  if (!row) return false;
  await revokeAllUserRefreshTokens(row.userId);
  return true;
}
