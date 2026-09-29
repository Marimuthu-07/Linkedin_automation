import { Router, Request, Response } from 'express';
import { prisma } from '@linkedin-growth/database';

export const healthRouter = Router();

healthRouter.get('/', async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    // Perform lightweight query check
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    mode: 'human-in-the-loop',
  });
});
