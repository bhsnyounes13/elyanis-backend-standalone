import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import * as adminUsersController from "../controllers/admin-users.controller.js";
import * as uploadController from "../controllers/upload.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdminMiddleware } from "../middleware/require-admin.js";

export function adminRoutes(): Router {
  const r = Router();
  r.use(authenticate);
  r.use(requireAdminMiddleware);
  r.get("/users", asyncHandler(adminUsersController.listUsers));
  r.patch("/users/:id", asyncHandler(adminUsersController.updateUserRole));
  r.delete("/users/:id", asyncHandler(adminUsersController.removeUser));
  r.post("/uploads/presign", asyncHandler(uploadController.presignPropertyImage));
  r.get("/dashboard", asyncHandler(adminController.dashboard));
  r.get("/inquiries", asyncHandler(adminController.listInquiries));
  r.delete("/contact-submissions/:id", asyncHandler(adminController.deleteContactSubmission));
  r.delete("/property-inquiries/:id", asyncHandler(adminController.deletePropertyInquiry));
  return r;
}
