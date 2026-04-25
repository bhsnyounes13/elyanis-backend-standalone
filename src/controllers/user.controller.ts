import type { Request, Response } from "express";

export async function profile(req: Request, res: Response): Promise<void> {
  res.json({
    message: "Authenticated user stub",
    user: req.authUser,
  });
}
