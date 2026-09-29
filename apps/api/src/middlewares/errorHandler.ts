import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'The request data did not match the expected schema',
      details: err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
    return;
  }

  // Handle known HTTP errors
  const status = typeof err.status === 'number' ? err.status : 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Structured console log for backend debugging (never expose stack in prod)
  console.error(`[API Error] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    status,
    stack: isProd ? undefined : err.stack,
  });

  res.status(status).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    ...(isProd ? {} : { stack: err.stack }),
  });
}
