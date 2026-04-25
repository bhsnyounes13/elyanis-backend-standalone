/**
 * Charger **avant** Express pour que les intégrations OTL / Express patchent les modules au bon moment.
 */
import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN?.trim();

if (dsn) {
  const tracesSampleRateRaw = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "");
  const tracesSampleRate =
    Number.isFinite(tracesSampleRateRaw) && tracesSampleRateRaw >= 0 && tracesSampleRateRaw <= 1
      ? tracesSampleRateRaw
      : process.env.NODE_ENV === "production"
        ? 0.2
        : 1;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    release: process.env.SENTRY_RELEASE?.trim() || undefined,
    integrations: [
      Sentry.httpIntegration({ spans: true }),
      Sentry.expressIntegration(),
    ],
    tracesSampleRate,
    sendDefaultPii: false,
  });
}
