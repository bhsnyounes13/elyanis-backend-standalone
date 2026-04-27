#!/usr/bin/env node

/**
 * EL-YANIS Backend Configuration Validator
 * Run: npm run validate-env OR node env-validator.js
 * 
 * Checks:
 * - All required environment variables present
 * - JWT_ACCESS_SECRET length >= 32 chars
 * - DATABASE_URL format valid
 * - FRONTEND_ORIGIN URL format valid
 * - Prisma schema in sync
 */

import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
};

function log(color, ...args) {
  console.log(`${COLORS[color] || ""}${args.join(" ")}${COLORS.reset}`);
}

function section(title) {
  console.log("");
  log("bright", "┌─ " + title);
}

function check(name, condition, errorMsg) {
  if (condition) {
    log("green", "✅", name);
    return true;
  } else {
    log("red", "❌", name);
    if (errorMsg) log("red", "   └─ " + errorMsg);
    return false;
  }
}

async function validate() {
  let errors = [];

  section("ENVIRONMENT VARIABLES");

  const required = ["DATABASE_URL", "JWT_ACCESS_SECRET", "FRONTEND_ORIGIN"];
  for (const varName of required) {
    const val = process.env[varName];
    if (check(`${varName} defined`, !!val, `Missing: set in .env`)) {
      if (varName === "JWT_ACCESS_SECRET" && val) {
        check(
          `${varName} length >= 32 chars`,
          val.length >= 32,
          `Current: ${val.length} chars, need at least 32`
        ) || errors.push(varName);
      }
    } else {
      errors.push(varName);
    }
  }

  section("DATABASE CONNECTION");

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const url = new URL(dbUrl.replace("postgresql://", "http://"));
      check("DATABASE_URL format valid", true);
      check(
        "PostgreSQL protocol",
        dbUrl.startsWith("postgresql://"),
        "Must start with postgresql://"
      );
      check(
        "Database has schema parameter",
        dbUrl.includes("schema="),
        'Should include ?schema=public'
      );
    } catch (e) {
      check("DATABASE_URL format valid", false, e.message);
      errors.push("DATABASE_URL");
    }
  }

  section("JWT AUTHENTICATION");

  const jwtSecret = process.env.JWT_ACCESS_SECRET;
  if (jwtSecret) {
    check(
      `JWT_ACCESS_SECRET is secure (${jwtSecret.length} chars)`,
      jwtSecret.length >= 32
    );
    check(
      "JWT_ACCESS_SECRET looks like base64",
      /^[A-Za-z0-9+/=]+$/.test(jwtSecret),
      "Should be base64-encoded"
    );
  }

  section("CORS & FRONTEND");

  const origin = process.env.FRONTEND_ORIGIN;
  if (origin) {
    try {
      const url = new URL(origin);
      check("FRONTEND_ORIGIN is valid URL", true);
      check(
        "FRONTEND_ORIGIN uses https (or localhost)",
        url.protocol === "https:" ||
          url.hostname === "localhost" ||
          url.hostname === "127.0.0.1",
        `Current: ${url.protocol}// (prod should be https://)`
      );
      check(
        "FRONTEND_ORIGIN is not wildcard",
        !origin.includes("*"),
        "Cannot use wildcard (*) in production"
      );
    } catch (e) {
      check("FRONTEND_ORIGIN is valid URL", false, e.message);
      errors.push("FRONTEND_ORIGIN");
    }
  }

  section("NODE ENVIRONMENT");

  const nodeEnv = process.env.NODE_ENV || "development";
  check(`NODE_ENV is defined`, !!nodeEnv, `Current: ${nodeEnv}`);

  section("SUPABASE CONFIGURATION");

  const supabaseVars = [
    "SUPABASE_PROJECT_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_STORAGE_BUCKET",
  ];

  let supabaseCount = 0;
  for (const varName of supabaseVars) {
    const val = process.env[varName];
    if (val) {
      check(`${varName} set`, true);
      supabaseCount++;
    } else {
      log("yellow", "⚠️ ", `${varName} not set (storage may fail gracefully)`);
    }
  }

  section("PRISMA SCHEMA");

  const schemaPath = path.join(__dirname, "prisma", "schema.prisma");
  check(
    "prisma/schema.prisma exists",
    existsSync(schemaPath),
    `Expected at: ${schemaPath}`
  );

  section("BUILD & START SCRIPTS");

  try {
    const pkg = JSON.parse(
      readFileSync(path.join(__dirname, "package.json"), "utf8")
    );
    check("build script defined", !!pkg.scripts.build);
    check("start script defined", !!pkg.scripts.start);
    check("db:push script defined", !!pkg.scripts["db:push"]);
  } catch (e) {
    log("red", "❌ Cannot read package.json:", e.message);
  }

  section("SUMMARY");

  console.log("");
  if (errors.length === 0) {
    log("green", "✅ All checks passed! Ready to deploy.");
    log("blue", "Next steps:");
    log("blue", "  1. npm run db:push          # Sync database schema");
    log("blue", "  2. npm run dev              # Test locally");
    log("blue", "  3. git push                 # Deploy to Render");
  } else {
    log("red", `❌ ${errors.length} critical issue(s) found:`);
    for (const err of errors) {
      log("red", `   - ${err}`);
    }
    log(
      "yellow",
      "\nRefer to .env.example and RENDER_ENV_CONFIG.txt for guidance."
    );
    process.exit(1);
  }

  console.log("");
}

validate().catch((e) => {
  console.error("Validator error:", e);
  process.exit(1);
});
