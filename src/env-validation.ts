/**
 * Validation centralisée au démarrage — échec rapide avec instructions exploitables.
 * Ordre : appeler avant Prisma et avant `listen`.
 */
import { config } from "./config.js";

const REF = "Voir le fichier `.env.example` à la racine du projet.";

function collectMissingDevRequired(): string[] {
  const missing: string[] = [];
  if (!process.env.DATABASE_URL?.trim()) missing.push("DATABASE_URL");
  if (!process.env.JWT_ACCESS_SECRET?.trim()) missing.push("JWT_ACCESS_SECRET");
  if (!process.env.FRONTEND_ORIGIN?.trim()) missing.push("FRONTEND_ORIGIN");
  return missing;
}

function formatStartupFailure(title: string, lines: string[]): Error {
  const banner = "═".repeat(64);
  const body = [
    "",
    banner,
    `  ${title}`,
    banner,
    "",
    ...lines.map((l) => `  ${l}`),
    "",
    `  ${REF}`,
    "",
    "  Étapes rapides :",
    "  1. Copier `.env.example` vers `.env` (même dossier que package.json).",
    "  2. Renseigner les variables listées ci-dessus.",
    "  3. Démarrer PostgreSQL, puis : npm run db:push",
    "  4. Relancer : npm run dev:api   ou   npm run dev:full",
    "",
    banner,
    "",
  ].join("\n");
  return new Error(body);
}

export function validateStartupEnvironment(): void {
  if (config.nodeEnv === "test") return;

  if (config.nodeEnv !== "production") {
    const missing = collectMissingDevRequired();
    if (missing.length > 0) {
      throw formatStartupFailure("CONFIGURATION (.env) — variables obligatoires manquantes", [
        `Manquant : ${missing.join(", ")}`,
        "",
        "DATABASE_URL — chaîne PostgreSQL, ex. :",
        '  postgresql://USER:PASSWORD@localhost:5432/nom_base?schema=public',
        "",
        "JWT_ACCESS_SECRET — au moins 32 caractères (signatures JWT).",
        "",
        "FRONTEND_ORIGIN — origine du frontend pour CORS et cookies (ex. http://localhost:8080).",
      ]);
    }
    const jwt = process.env.JWT_ACCESS_SECRET!.trim();
    if (jwt.length < 32) {
      throw formatStartupFailure("CONFIGURATION — JWT_ACCESS_SECRET trop court", [
        `Longueur actuelle : ${jwt.length} caractères ; minimum : 32.`,
      ]);
    }
    return;
  }

  const missingProd: string[] = [];
  if (!process.env.DATABASE_URL?.trim()) missingProd.push("DATABASE_URL");
  if (!process.env.JWT_ACCESS_SECRET?.trim()) missingProd.push("JWT_ACCESS_SECRET");
  if (missingProd.length > 0) {
    throw formatStartupFailure("PRODUCTION — variables obligatoires manquantes", [
      `Manquant : ${missingProd.join(", ")}`,
    ]);
  }

  const jwtSecret = process.env.JWT_ACCESS_SECRET!.trim();
  if (jwtSecret.length < 32) {
    throw formatStartupFailure("PRODUCTION — JWT_ACCESS_SECRET invalide", [
      `Minimum 32 caractères (actuellement ${jwtSecret.length}).`,
    ]);
  }

  const origin = config.frontendOrigin;
  if (origin === "*" || origin.includes(",")) {
    throw formatStartupFailure("PRODUCTION — FRONTEND_ORIGIN invalide", [
      "Une seule origine est autorisée (pas de wildcard ni de liste).",
    ]);
  }
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
      throw formatStartupFailure("PRODUCTION — FRONTEND_ORIGIN", [
        "Utilisez https:// sauf pour localhost / 127.0.0.1.",
      ]);
    }
  } catch (e) {
    if (e instanceof TypeError) {
      throw formatStartupFailure("PRODUCTION — FRONTEND_ORIGIN", [
        `URL invalide : ${origin}`,
      ]);
    }
    throw e;
  }

  if (!process.env.TURNSTILE_SECRET_KEY?.trim()) {
    console.warn(
      "[env] PRODUCTION : TURNSTILE_SECRET_KEY absent — les formulaires publics n’exigeront pas Turnstile tant que la clé n’est pas définie. Définissez la clé pour la production exposée sur Internet.",
    );
  }
}
