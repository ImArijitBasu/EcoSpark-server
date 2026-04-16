import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/apiResponse';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      const messages = error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`) || [];
      sendError(res, `Validation failed: ${messages.join(', ')}`, 422);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed;
      next();
    } catch (error: any) {
      const messages = error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`) || [];
      sendError(res, `Query validation failed: ${messages.join(', ')}`, 422);
    }
  };
}
