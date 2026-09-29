import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const app = createApp();

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 LinkedIn Growth Assistant API listening on http://${HOST}:${PORT}`);
  console.log(`🔒 Mode: Human-in-the-Loop Productivity (No unauthorized automation)`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
