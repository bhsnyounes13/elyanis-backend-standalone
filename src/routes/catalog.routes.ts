import { Router } from "express";
import * as catalogController from "../controllers/catalog.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { authenticate, requireRoles } from "../middleware/auth.middleware.js";

export function catalogRoutes(): Router {
  const r = Router();
  r.get("/", asyncHandler(catalogController.list));
  r.get("/:id", asyncHandler(catalogController.getById));
  r.post("/", authenticate, requireRoles("admin"), asyncHandler(catalogController.create));
  r.patch("/:id", authenticate, requireRoles("admin"), asyncHandler(catalogController.update));
  r.delete("/:id", authenticate, requireRoles("admin"), asyncHandler(catalogController.remove));
  return r;
}
