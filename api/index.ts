import "dotenv/config";
import "../src/instrument.js";
import * as Sentry from "@sentry/node";
import { validateStartupEnvironment } from "../src/env-validation.js";
import { createApp } from "../src/app.js";

// Only validate env on first request, skip heavy bootstrap
validateStartupEnvironment();

export const app = createApp();

export default app;
