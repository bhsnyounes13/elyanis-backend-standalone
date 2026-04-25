import type { NextFunction, Request, Response } from "express";

function isHttpsRequest(req: Request): boolean {
  if (req.secure) return true;
  const xf = req.get("x-forwarded-proto");
  const first = xf?.split(",")[0]?.trim();
  return first === "https";
}

/**
 * En-têtes pour l’API JSON (pas de CSP HTML — évite de casser les clients REST).
 * HSTS uniquement si la requête est vue comme HTTPS (terminaison TLS derrière proxy).
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );

  if (isHttpsRequest(req)) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  next();
}
