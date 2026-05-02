import { Router } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route GET /api/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/', async (_req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'HydratePet API',
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      success: true,
      data: {
        ...healthcheck,
        database: 'connected',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    logger.error('Health check failed', error as Error);
    
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database connection failed',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
});

/**
 * @route GET /api/health/ping
 * @desc Simple ping endpoint
 * @access Public
 */
router.get('/ping', (_req, res) => {
  res.status(200).json({ 
    success: true, 
    data: { message: 'pong' },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

export { router as healthRouter };
