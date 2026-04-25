import rateLimit from "express-rate-limit";

/** Limite globale sur `/api/*` contre abus / scraping (complète les rate limits ciblés auth/forms). */
export const globalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.method === "OPTIONS" ||
    req.path === "/health" ||
    (typeof req.originalUrl === "string" && req.originalUrl.startsWith("/api/health")),
  handler: (_req, res) => {
    res.status(429).json({
      error: "Trop de requêtes. Réessayez dans quelques minutes.",
      code: "RATE_LIMIT_EXCEEDED",
    });
  },
});
