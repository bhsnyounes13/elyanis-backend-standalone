import type { Request } from "express";
import { config } from "../config.js";
import { HttpError } from "../errors/http-error.js";
import { verifyTurnstileToken } from "../services/turnstile.service.js";
import { getClientIp } from "./client-ip.js";

export async function assertTurnstileIfRequired(
  token: string | undefined,
  req: Request,
): Promise<void> {
  if (!config.formsRequireTurnstile) {
    return;
  }
  if (!config.turnstileSecretKey) {
    throw new HttpError(
      503,
      "Configuration serveur incomplète pour la protection anti-robot.",
      { code: "TURNSTILE_NOT_CONFIGURED" },
    );
  }
  const ip = getClientIp(req);
  const ok = await verifyTurnstileToken(token, ip);
  if (!ok) {
    throw new HttpError(
      400,
      "La vérification anti-robot a échoué ou a expiré. Actualisez la page et réessayez.",
      { code: "TURNSTILE_FAILED" },
    );
  }
}
