import { config } from "../config.js";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Vérifie un jeton Turnstile auprès de Cloudflare (ne jamais faire confiance au client).
 */
export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp: string | undefined,
): Promise<boolean> {
  if (!config.turnstileSecretKey) {
    return false;
  }
  if (!token || token.length < 10) {
    return false;
  }

  const body = new URLSearchParams();
  body.set("secret", config.turnstileSecretKey);
  body.set("response", token);
  if (remoteIp && remoteIp.length <= 128) {
    body.set("remoteip", remoteIp);
  }

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    return false;
  }

  const data = (await res.json()) as TurnstileVerifyResponse;
  return data.success === true;
}
