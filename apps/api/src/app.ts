import express from 'express';
import cors from 'cors';
import { requestLogger } from './middlewares/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { healthRouter } from './routes/health.js';
import { dashboardRouter } from './routes/dashboard.js';
import { networkingRouter } from './routes/networking.js';
import { contentRouter } from './routes/content.js';
import { leadsRouter } from './routes/leads.js';
import { internshipsRouter } from './routes/internships.js';
import { analyticsRouter } from './routes/analytics.js';
import { tasksRouter } from './routes/tasks.js';
import { notificationsRouter } from './routes/notifications.js';
import { settingsRouter } from './routes/settings.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }));
  app.use(express.json({ limit: '5mb' }));
  app.use(requestLogger);

  // API Routes
  app.use('/api/health', healthRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/networking', networkingRouter);
  app.use('/api/content', contentRouter);
  app.use('/api/leads', leadsRouter);
  app.use('/api/internships', internshipsRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/settings', settingsRouter);

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    });
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
