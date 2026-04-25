import type { UserRole } from "./types/auth.js";

declare global {
  namespace Express {
    interface Request {
      authUser?: { id: string; email: string; role: UserRole };
    }
  }
}

export {};
