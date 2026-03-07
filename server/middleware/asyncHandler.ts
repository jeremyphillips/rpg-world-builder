import type { Request, Response, NextFunction } from 'express'

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void | Response>

/**
 * Wraps async route handlers so errors are forwarded to the error handler.
 * Use instead of try/catch in every async controller.
 */
export function asyncHandler(fn: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
