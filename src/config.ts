function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

function stripTrailingSlash(s: string): string {
  return s.replace(/\/$/, "");
}

function firstNonEmptyEnv(names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

/**
 * Origine publique du site (CORS, cookies). En prod : `FRONTEND_ORIGIN` si défini,
 * sinon sur Railway `https://${RAILWAY_PUBLIC_DOMAIN}` quand un domaine public est généré.
 */
function resolveFrontendOrigin(): string {
  const explicit = process.env.FRONTEND_ORIGIN?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  const nodeEnv = process.env.NODE_ENV ?? "development";
  if (nodeEnv !== "production") {
    return "http://localhost:8080";
  }

  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railway) {
    const host = stripTrailingSlash(railway.replace(/^https?:\/\//i, ""));
    return `https://${host}`;
  }

  // Dernier recours : permet au processus d’écouter (healthcheck Railway) même si le domaine
  // public n’est pas encore généré. Pour le trafic navigateur réel, définir FRONTEND_ORIGIN
  // ou activer un domaine public Railway (RAILWAY_PUBLIC_DOMAIN).
  console.warn(
    "[config] FRONTEND_ORIGIN et RAILWAY_PUBLIC_DOMAIN absents — utilisation de http://127.0.0.1:3000 pour CORS/cookies. Définissez FRONTEND_ORIGIN avec l’URL publique du site.",
  );
  return "http://127.0.0.1:3000";
}

const storageEndpoint = firstNonEmptyEnv(["STORAGE_ENDPOINT", "S3_ENDPOINT"]);
const storageRegion =
  firstNonEmptyEnv(["STORAGE_REGION", "S3_REGION"]) || (storageEndpoint ? "auto" : "us-east-1");
const storagePublicUrl = stripTrailingSlash(
  firstNonEmptyEnv(["STORAGE_PUBLIC_URL", "S3_PUBLIC_URL"]),
);

export const config = {
  /** Port HTTP Express : `PORT` dans l’environnement, sinon 3000. */
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV ?? "development",
  /**
   * Origine exacte du frontend (CORS + cookies). En production : une seule URL, jamais `*`.
   * Voir `resolveFrontendOrigin` (Railway : repli sur `RAILWAY_PUBLIC_DOMAIN`).
   */
  frontendOrigin: resolveFrontendOrigin(),
  jwtAccessSecret: () =>
    process.env.NODE_ENV === "test"
      ? "test-access-secret-min-32-chars-long!!"
      : required("JWT_ACCESS_SECRET"),
  /** Durée du JWT d’accès (ex: 15m, 900s) */
  accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES ?? "15m",
  /** Durée de vie du refresh token (cookie) en jours */
  refreshTokenDays: Number(process.env.JWT_REFRESH_DAYS ?? "7"),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? "12"),
  cookieName: process.env.REFRESH_COOKIE_NAME ?? "ely_refresh",

  /** Secret Turnstile (serveur). Si défini, les formulaires publics exigent une vérification réussie. */
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY?.trim() ?? "",
  /**
   * Activer la vérification Turnstile pour les routes formulaires / auth.
   * Par défaut : true si `TURNSTILE_SECRET_KEY` est défini, sinon false (dev local).
   * Mettre explicitement `false` pour désactiver même avec secret (tests uniquement).
   */
  formsRequireTurnstile:
    process.env.FORMS_REQUIRE_TURNSTILE === "false"
      ? false
      : Boolean(process.env.TURNSTILE_SECRET_KEY?.trim()),

  /** Supabase Configuration */
  supabase: {
    projectUrl: required("SUPABASE_PROJECT_URL"),
    anonKey: required("SUPABASE_ANON_KEY"),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "property-photos",
  },

  /**
   * Fallback stockage local (développement).
   */
  localUploadRoot:
    process.env.STORAGE_LOCAL_ROOT?.trim() ?? "data/uploads",
  localUploadPublicBase: process.env.STORAGE_LOCAL_PUBLIC_BASE?.trim() ?? "",
};
