import { Router } from "express";
import * as agentController from "../controllers/agent.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { authenticate, requireRoles } from "../middleware/auth.middleware.js";

export function agentRoutes(): Router {
  const r = Router();
  r.get("/", asyncHandler(agentController.list));
  r.get("/:id", asyncHandler(agentController.getById));
  r.post("/", authenticate, requireRoles("admin"), asyncHandler(agentController.create));
  r.patch("/:id", authenticate, requireRoles("admin"), asyncHandler(agentController.update));
  r.delete("/:id", authenticate, requireRoles("admin"), asyncHandler(agentController.remove));
  return r;
}
