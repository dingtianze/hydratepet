import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Connection management
export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('💚 Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database', error as Error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await disconnectDB();
});
