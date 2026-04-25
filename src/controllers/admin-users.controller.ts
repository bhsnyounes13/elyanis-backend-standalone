import type { Request, Response } from "express";
import type { Role } from "@prisma/client";
import { HttpError } from "../errors/http-error.js";
import { revokeAllUserRefreshTokens } from "../services/refresh-token.service.js";
import * as userService from "../services/user.service.js";
import { adminUpdateUserRoleSchema } from "../validators/schemas.js";

function parseId(req: Request): string {
  const id = req.params.id?.trim();
  if (!id) throw new HttpError(400, "Identifiant manquant.");
  return id;
}

/** Liste des comptes (sans hash mot de passe). */
export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await userService.listUsersForAdmin();
  res.json({ users });
}

/**
 * Changement de rôle — empêche la suppression du dernier admin et l’auto‑rétrogradation
 * si aucun autre admin n’existe (escalade de privilèges / lockout).
 */
export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const actorId = req.authUser!.id;
  const targetId = parseId(req);

  const parsed = adminUpdateUserRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Données invalides.", {
      code: "VALIDATION_ERROR",
      details: parsed.error.flatten(),
    });
  }

  const newRole = parsed.data.role as Role;
  const target = await userService.findUserById(targetId);
  if (!target) {
    throw new HttpError(404, "Utilisateur introuvable.", { code: "USER_NOT_FOUND" });
  }

  const adminCount = await userService.countUsersWithRole("admin");

  if (target.role === "admin" && newRole === "user") {
    if (adminCount <= 1) {
      throw new HttpError(
        403,
        "Impossible de retirer le rôle administrateur au dernier compte admin.",
        { code: "LAST_ADMIN" },
      );
    }
  }

  if (targetId === actorId && newRole === "user") {
    if (adminCount < 2) {
      throw new HttpError(
        403,
        "Un autre administrateur doit exister avant de rétrograder votre compte.",
        { code: "SELF_DEMOTE_FORBIDDEN" },
      );
    }
  }

  const updated = await userService.updateUserRole(targetId, newRole);
  await revokeAllUserRefreshTokens(targetId);

  res.json({ user: updated });
}

/** Suppression — pas de suicide compte ; pas de suppression du dernier admin. */
export async function removeUser(req: Request, res: Response): Promise<void> {
  const actorId = req.authUser!.id;
  const targetId = parseId(req);

  if (targetId === actorId) {
    throw new HttpError(
      403,
      "Vous ne pouvez pas supprimer votre propre compte depuis le panneau admin.",
      { code: "SELF_DELETE_FORBIDDEN" },
    );
  }

  const target = await userService.findUserById(targetId);
  if (!target) {
    throw new HttpError(404, "Utilisateur introuvable.", { code: "USER_NOT_FOUND" });
  }

  if (target.role === "admin") {
    const admins = await userService.countUsersWithRole("admin");
    if (admins <= 1) {
      throw new HttpError(
        403,
        "Impossible de supprimer le dernier administrateur.",
        { code: "LAST_ADMIN" },
      );
    }
  }

  await revokeAllUserRefreshTokens(targetId);
  await userService.deleteUserCascade(targetId);
  res.status(204).send();
}
