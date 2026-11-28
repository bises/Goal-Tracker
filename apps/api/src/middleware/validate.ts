import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';

/**
 * Express middleware to validate request body with a Zod schema.
 */
export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Express middleware to validate request query parameters with a Zod schema.
 */
export function validateQuery<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Express middleware to validate request path parameters with a Zod schema.
 */
export function validateParams<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
}
