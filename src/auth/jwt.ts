import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config.js";
import type { UserRole } from "../types/auth.js";

export interface AccessPayload {
  sub: string;
  email: string;
  role: UserRole;
  typ: "access";
}

export function signAccessToken(userId: string, email: string, role: UserRole): string {
  const payload: AccessPayload = {
    sub: userId,
    email,
    role,
    typ: "access",
  };
  const opts: SignOptions = {
    expiresIn: config.accessTokenExpiresIn as SignOptions["expiresIn"],
    issuer: "elyanis-api",
    audience: "elyanis-spa",
  };
  return jwt.sign(payload, config.jwtAccessSecret(), opts);
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, config.jwtAccessSecret(), {
    issuer: "elyanis-api",
    audience: "elyanis-spa",
  }) as AccessPayload;
  if (decoded.typ !== "access") throw new jwt.JsonWebTokenError("Invalid token type");
  return decoded;
}
