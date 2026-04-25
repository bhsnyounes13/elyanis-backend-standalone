import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  authLoginRateLimiter,
  authRegisterRateLimiter,
} from "../middleware/rate-limit.js";

export function authRoutes(): Router {
  const r = Router();
  r.post("/register", authRegisterRateLimiter, asyncHandler(authController.register));
  r.post("/login", authLoginRateLimiter, asyncHandler(authController.login));
  r.post("/logout", asyncHandler(authController.logout));
  r.post("/refresh", asyncHandler(authController.refresh));
  r.get("/me", authenticate, asyncHandler(authController.me));
  return r;
}
