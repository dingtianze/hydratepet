import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../config/database';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        authType: string;
        nickname: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Access token is required');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      authType: string;
      nickname: string;
    };

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, authType: true, nickname: true, isActive: true },
    });

    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'FORBIDDEN', 'Account is deactivated');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      authType: user.authType,
      nickname: user.nickname,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
      return;
    }
    next(error);
  }
};

// Optional authentication - doesn't throw if no token
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      authType: string;
      nickname: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, authType: true, nickname: true, isActive: true },
    });

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        authType: user.authType,
        nickname: user.nickname,
      };
    }

    next();
  } catch {
    // Ignore auth errors for optional auth
    next();
  }
};
