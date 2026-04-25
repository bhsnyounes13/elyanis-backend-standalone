import { Router } from "express";
import * as inquiryController from "../controllers/inquiry.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { publicFormRateLimiter } from "../middleware/rate-limit.js";

/** Monté sur `/api` → POST `/api/contact`, POST `/api/inquiries`. */
export function inquiryPublicRoutes(): Router {
  const r = Router();
  r.post("/contact", publicFormRateLimiter, asyncHandler(inquiryController.submitContact));
  r.post("/inquiries", publicFormRateLimiter, asyncHandler(inquiryController.submitPropertyInquiry));
  return r;
}
