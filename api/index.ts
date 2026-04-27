import "dotenv/config";
import "./instrument.js";
import * as Sentry from "@sentry/node";
import { validateStartupEnvironment } from "./env-validation.js";
import { createApp } from "./app.js";

// Only validate env on first request, skip heavy bootstrap
validateStartupEnvironment();

export const app = createApp();

export default app;
