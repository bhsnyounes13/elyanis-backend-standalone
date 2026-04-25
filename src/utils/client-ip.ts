import type { Request } from "express";

/** IP client (proxy / X-Forwarded-For géré si `trust proxy` est activé). */
export function getClientIp(req: Request): string | undefined {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length > 0) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first.slice(0, 128);
  }
  const socketIp = req.socket.remoteAddress;
  if (socketIp) return socketIp.slice(0, 128);
  if (typeof req.ip === "string") return req.ip.slice(0, 128);
  return undefined;
}
