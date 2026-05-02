import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    requestId: req.headers['x-request-id'],
  });

  // Handle known API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || crypto.randomUUID(),
      },
    });
    return;
  }

  // Handle validation errors (Zod)
  if (err.name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || crypto.randomUUID(),
      },
    });
    return;
  }

  // Handle Prisma errors
  if (err.name?.startsWith('Prisma')) {
    if (err.message?.includes('Unique constraint')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'Resource already exists',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || crypto.randomUUID(),
        },
      });
      return;
    }

    if (err.message?.includes('Foreign key constraint')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FOREIGN_KEY_ERROR',
          message: 'Referenced resource does not exist',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || crypto.randomUUID(),
        },
      });
      return;
    }
  }

  // Default: 500 Internal Server Error
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDev ? err.message : 'Something went wrong!',
      ...(isDev && { stack: err.stack }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || crypto.randomUUID(),
    },
  });
};
