import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.LOG_LEVEL !== 'silent') {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: duration,
        })
      );
    }
  });

  next();
}
