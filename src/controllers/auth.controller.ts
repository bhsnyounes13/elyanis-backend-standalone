import type { Request, Response } from "express";
import type { Role } from "@prisma/client";
import { config } from "../config.js";
import { signAccessToken, verifyAccessToken } from "../auth/jwt.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import {
  createRefreshToken,
  consumeRefreshToken,
  revokeAllUserRefreshTokens,
  revokeByRefreshCookieRaw,
} from "../services/refresh-token.service.js";
import * as userService from "../services/user.service.js";
import { HttpError } from "../errors/http-error.js";
import { authBodyPublicSchema } from "../validators/schemas.js";
import { assertTurnstileIfRequired } from "../utils/form-security.js";

function setRefreshCookie(res: Response, rawToken: string, expiresAt: Date): void {
  res.cookie(config.cookieName, rawToken, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
  });
}

function publicUser(u: { id: string; email: string; role: Role }) {
  return { id: u.id, email: u.email, role: u.role };
}

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = authBodyPublicSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Données invalides.", {
      details: parsed.error.flatten(),
      code: "VALIDATION_ERROR",
    });
  }
  const { email, password, turnstileToken } = parsed.data;
  await assertTurnstileIfRequired(turnstileToken, req);

  const existing = await userService.findUserByEmail(email);
  if (existing) {
    throw new HttpError(409, "Cette adresse e-mail est déjà utilisée.", { code: "EMAIL_TAKEN" });
  }

  const isFirstUser = (await userService.countUsers()) === 0;
  const bootstrapAdminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const role: Role =
    isFirstUser || (bootstrapAdminEmail && email.trim().toLowerCase() === bootstrapAdminEmail)
      ? "admin"
      : "user";

  const passwordHash = await hashPassword(password);
  const user = await userService.createUser(email, passwordHash, role);

  const accessToken = signAccessToken(user.id, user.email, user.role);
  const { rawToken, expiresAt } = await createRefreshToken(user.id);
  setRefreshCookie(res, rawToken, expiresAt);

  res.status(201).json({
    accessToken,
    expiresIn: config.accessTokenExpiresIn,
    user: publicUser(user),
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = authBodyPublicSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Données invalides.", {
      details: parsed.error.flatten(),
      code: "VALIDATION_ERROR",
    });
  }
  const { email, password, turnstileToken } = parsed.data;
  await assertTurnstileIfRequired(turnstileToken, req);

  const user = await userService.findUserByEmail(email);
  const valid = user && (await verifyPassword(password, user.passwordHash));
  if (!valid) {
    throw new HttpError(401, "E-mail ou mot de passe incorrect.", { code: "INVALID_CREDENTIALS" });
  }

  await revokeAllUserRefreshTokens(user!.id);
  const accessToken = signAccessToken(user!.id, user!.email, user!.role);
  const { rawToken, expiresAt } = await createRefreshToken(user!.id);
  setRefreshCookie(res, rawToken, expiresAt);

  res.json({
    accessToken,
    expiresIn: config.accessTokenExpiresIn,
    user: publicUser(user!),
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  let revokedByAccess = false;
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7).trim()
    : "";
  if (bearer) {
    try {
      const payload = verifyAccessToken(bearer);
      await revokeAllUserRefreshTokens(payload.sub);
      revokedByAccess = true;
    } catch {
      /* token expiré */
    }
  }
  const raw = req.cookies?.[config.cookieName] as string | undefined;
  if (!revokedByAccess && raw) {
    await revokeByRefreshCookieRaw(raw);
  }
  clearRefreshCookie(res);
  res.json({ ok: true });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const raw = req.cookies?.[config.cookieName] as string | undefined;
  if (!raw) {
    throw new HttpError(401, "No refresh token", { code: "NO_REFRESH_TOKEN" });
  }
  const consumed = await consumeRefreshToken(raw);
  if (!consumed) {
    clearRefreshCookie(res);
    throw new HttpError(401, "Invalid refresh token", { code: "INVALID_REFRESH_TOKEN" });
  }

  const user = await userService.findUserById(consumed.userId);
  if (!user) {
    clearRefreshCookie(res);
    throw new HttpError(401, "User not found", { code: "USER_GONE" });
  }

  const accessToken = signAccessToken(user.id, user.email, user.role);
  const { rawToken, expiresAt } = await createRefreshToken(user.id);
  setRefreshCookie(res, rawToken, expiresAt);

  res.json({
    accessToken,
    expiresIn: config.accessTokenExpiresIn,
    user: publicUser(user),
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await userService.findUserById(req.authUser!.id);
  if (!user) {
    throw new HttpError(401, "User not found", { code: "USER_GONE" });
  }
  res.json({ user: publicUser(user) });
}
