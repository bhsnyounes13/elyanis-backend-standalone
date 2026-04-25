import type { NextFunction, Request, RequestHandler, Response } from "express";

/** Encapsule un handler async pour transmission des erreurs vers `errorHandler`. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}
