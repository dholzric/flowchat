import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

// Handle Prisma client errors
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);

  return result;
});

export default prisma;
