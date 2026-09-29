import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __db__: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient({
      log: process.env.LOG_LEVEL === 'debug' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  prisma = global.__db__;
}

export { prisma };
export default prisma;
