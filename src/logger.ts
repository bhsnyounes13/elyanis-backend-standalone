import pino from "pino";

const level =
  process.env.LOG_LEVEL?.trim() ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

/** Sortie JSON structurée (agrégable par Datadog, CloudWatch, Loki, ELK, etc.). */
export const logger = pino({
  level,
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "password", "passwordHash"],
    remove: true,
  },
  ...(process.env.NODE_ENV !== "production"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});
