import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { authenticate } from "../middleware/auth.middleware.js";

export function userRoutes(): Router {
  const r = Router();
  r.use(authenticate);
  r.get("/profile", asyncHandler(userController.profile));
  return r;
}
