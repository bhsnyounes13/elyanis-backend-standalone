import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../auth/jwt.js";
import type { UserRole } from "../types/auth.js";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

function extractBearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized", code: "NO_ACCESS_TOKEN" });
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.authUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    res
      .status(401)
      .json({ error: "Invalid or expired access token", code: "INVALID_ACCESS_TOKEN" });
  }
}

export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    next();
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.authUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    /* ignore */
  }
  next();
}

export function requireRoles(...allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.authUser;
    if (!user) {
      res.status(401).json({ error: "Unauthorized", code: "NOT_AUTHENTICATED" });
      return;
    }
    if (!allowed.includes(user.role)) {
      res.status(403).json({ error: "Forbidden", code: "INSUFFICIENT_ROLE" });
      return;
    }
    next();
  };
}
