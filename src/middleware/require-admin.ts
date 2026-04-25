import { requireRoles } from "./auth.middleware.js";

/** Accès réservé au rôle serveur `admin` (JWT vérifié avant). */
export const requireAdminMiddleware = requireRoles("admin");
