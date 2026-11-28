import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ApiErrorEnvelope {
  errorCode: string;
  message: string;
  error: string; // Backward compatibility with clients expecting { error: string }
  details?: Array<{ path: string; message: string; code?: string }>;
}

export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 400,
    errorCode: string = 'BAD_REQUEST',
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global Express error handling middleware.
 * Normalizes error responses to { errorCode, message, error, details? }.
 * Prevents stack traces and raw internals from leaking in 500 responses.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err);
  }

  // 1. Zod Validation Error (HTTP 400)
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));
    const message = err.errors[0]?.message || 'Validation error';

    res.status(400).json({
      errorCode: 'VALIDATION_ERROR',
      message,
      error: message,
      details,
    });
    return;
  }

  // 2. Determine HTTP Status Code
  const statusCode =
    typeof err?.statusCode === 'number'
      ? err.statusCode
      : typeof err?.status === 'number'
      ? err.status
      : 500;

  const defaultErrorCode =
    statusCode === 400
      ? 'BAD_REQUEST'
      : statusCode === 401
      ? 'UNAUTHORIZED'
      : statusCode === 403
      ? 'FORBIDDEN'
      : statusCode === 404
      ? 'NOT_FOUND'
      : statusCode === 409
      ? 'CONFLICT'
      : 'INTERNAL_SERVER_ERROR';

  const errorCode = err?.errorCode || defaultErrorCode;

  // Mask internal error messages on 500 to prevent information leakage
  const message =
    statusCode === 500
      ? 'Internal server error'
      : err?.message || 'An error occurred';

  if (statusCode === 500) {
    console.error('Unhandled server error:', err instanceof Error ? err.stack || err.message : err);
  }

  const responseBody: ApiErrorEnvelope = {
    errorCode,
    message,
    error: message,
  };

  if (err?.details) {
    responseBody.details = err.details;
  }

  res.status(statusCode).json(responseBody);
}
