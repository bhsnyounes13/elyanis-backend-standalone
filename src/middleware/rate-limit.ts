import rateLimit from "express-rate-limit";

const json429 = (msg: string) =>
  (_req: unknown, res: import("express").Response) => {
    res.status(429).json({
      error: msg,
      code: "RATE_LIMIT_EXCEEDED",
    });
  };

/** Formulaires publics : contact + demande bien */
export const publicFormRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429(
    "Trop de demandes depuis cette adresse. Veuillez patienter quelques minutes avant de réessayer.",
  ),
});

/** Connexion */
export const authLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429(
    "Trop de tentatives de connexion. Réessayez dans quelques minutes ou réinitialisez votre mot de passe.",
  ),
});

/** Inscription */
export const authRegisterRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429(
    "Trop de tentatives d’inscription depuis cette adresse. Réessayez plus tard.",
  ),
});
