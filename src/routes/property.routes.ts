import { Router } from "express";
import * as propertyController from "../controllers/property.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { authenticate, requireRoles } from "../middleware/auth.middleware.js";

export function propertyRoutes(): Router {
  const r = Router();
  r.get("/", asyncHandler(propertyController.list));
  r.get("/featured", asyncHandler(propertyController.featured));
  r.get("/:id", asyncHandler(propertyController.getById));
  r.post("/", authenticate, requireRoles("admin"), asyncHandler(propertyController.create));
  r.patch("/:id", authenticate, requireRoles("admin"), asyncHandler(propertyController.update));
  r.delete("/:id", authenticate, requireRoles("admin"), asyncHandler(propertyController.remove));
  return r;
}
