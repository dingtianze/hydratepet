import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  authType: z.enum(['guest', 'phone', 'wechat']),
  phone: z.string().optional(),
  wechatCode: z.string().optional(),
  nickname: z.string().min(1).max(50),
  weight: z.number().int().min(20).max(300),
  gender: z.enum(['male', 'female', 'other']),
  workHours: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  }),
});

const loginSchema = z.object({
  authType: z.enum(['phone', 'wechat']),
  phone: z.string().optional(),
  code: z.string().optional(),
  wechatCode: z.string().optional(),
});

// Helper: Generate tokens
const generateTokens = (userId: string, authType: string, nickname: string) => {
  const accessToken = jwt.sign(
    { userId, authType, nickname },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'] }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
  );

  return { accessToken, refreshToken };
};

// Helper: Calculate daily goal based on weight
const calculateDailyGoal = (weight: number, gender: string): number => {
  const base = weight * (gender === 'male' ? 35 : 30);
  return Math.round(base / 50) * 50;
};

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Validate auth-specific fields
    if (data.authType === 'phone' && !data.phone) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Phone number is required for phone auth');
    }
    if (data.authType === 'wechat' && !data.wechatCode) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'WeChat code is required for WeChat auth');
    }

    // Check for duplicate phone/wechat
    if (data.phone) {
      const existing = await prisma.user.findUnique({
        where: { phone: data.phone },
      });
      if (existing) {
        throw new ApiError(409, 'DUPLICATE_ENTRY', 'Phone number already registered');
      }
    }

    // Calculate daily goal
    const dailyGoal = calculateDailyGoal(data.weight, data.gender);

    // Create user with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          authType: data.authType,
          phone: data.phone,
          nickname: data.nickname,
          weight: data.weight,
          gender: data.gender,
          workStart: data.workHours.start,
          workEnd: data.workHours.end,
          dailyGoal,
        },
      });

      // Create default pet
      const pet = await tx.pet.create({
        data: {
          userId: user.id,
          name: '小水滴',
          stage: 'egg',
          growth: 0,
          mood: 'happy',
        },
      });

      // Create default reminder config
      await tx.reminderConfig.create({
        data: {
          userId: user.id,
          enabled: true,
          intervals: JSON.stringify(['09:30', '11:00', '14:00', '16:00', '17:00']),
        },
      });

      return { user, pet };
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
      result.user.id,
      result.user.authType,
      result.user.nickname
    );

    logger.info({ message: 'User registered', userId: result.user.id });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          authType: result.user.authType,
          nickname: result.user.nickname,
          weight: result.user.weight,
          gender: result.user.gender,
          workStart: result.user.workStart,
          workEnd: result.user.workEnd,
          dailyGoal: result.user.dailyGoal,
        },
        pet: {
          id: result.pet.id,
          name: result.pet.name,
          stage: result.pet.stage,
          growth: result.pet.growth,
          mood: result.pet.mood,
        },
        token: accessToken,
        refreshToken,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    
    // Find user
    let user;
    if (data.authType === 'phone' && data.phone) {
      // TODO: Verify SMS code
      user = await prisma.user.findUnique({
        where: { phone: data.phone },
      });
    } else if (data.authType === 'wechat' && data.wechatCode) {
      // TODO: Exchange WeChat code for openid
      throw new ApiError(501, 'NOT_IMPLEMENTED', 'WeChat login not implemented yet');
    }

    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'FORBIDDEN', 'Account is deactivated');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.authType,
      user.nickname
    );

    logger.info({ message: 'User logged in', userId: user.id });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          authType: user.authType,
          nickname: user.nickname,
          weight: user.weight,
          gender: user.gender,
          workStart: user.workStart,
          workEnd: user.workEnd,
          dailyGoal: user.dailyGoal,
        },
        token: accessToken,
        refreshToken,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Refresh token is required');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
      userId: string;
      type: string;
    };

    if (decoded.type !== 'refresh') {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid refresh token');
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, 'UNAUTHORIZED', 'User not found or inactive');
    }

    // Generate new tokens
    const tokens = generateTokens(user.id, user.authType, user.nickname);

    res.status(200).json({
      success: true,
      data: tokens,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'UNAUTHORIZED', 'Invalid refresh token'));
      return;
    }
    next(error);
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client should discard tokens)
 * @access Private
 */
router.post('/logout', authenticate, async (req, res) => {
  logger.info({ message: 'User logged out', userId: req.user?.id });

  res.status(200).json({
    success: true,
    data: { message: 'Logged out successfully' },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
});

/**
 * @route POST /api/auth/guest
 * @desc Quick guest login - creates a temporary user
 * @access Public
 */
router.post('/guest', async (_req, res, next) => {
  try {
    // Generate random guest info
    const guestId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const dailyGoal = 2000; // Default 2000ml

    // Create guest user with transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          authType: 'guest',
          phone: null,
          nickname: `游客${guestId}`,
          weight: 65,
          gender: 'other',
          workStart: '09:00',
          workEnd: '18:00',
          dailyGoal,
        },
      });

      // Create default pet for guest
      const pet = await tx.pet.create({
        data: {
          userId: user.id,
          name: '小水滴',
          stage: 'egg',
          growth: 0,
          mood: 'happy',
        },
      });

    // Create default reminder config
    await tx.reminderConfig.create({
      data: {
        userId: user.id,
        enabled: true,
        intervals: JSON.stringify(['09:30', '11:00', '14:00', '16:00', '17:00']),
      },
    });

    return { user, pet };
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(
    result.user.id,
    result.user.authType,
    result.user.nickname
  );

  logger.info({ message: 'Guest user created', userId: result.user.id });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          authType: result.user.authType,
          nickname: result.user.nickname,
          weight: result.user.weight,
          gender: result.user.gender,
          workStart: result.user.workStart,
          workEnd: result.user.workEnd,
          dailyGoal: result.user.dailyGoal,
        },
        pet: {
          id: result.pet.id,
          name: result.pet.name,
          stage: result.pet.stage,
          growth: result.pet.growth,
          mood: result.pet.mood,
        },
        token: accessToken,
        refreshToken,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/verify-code
 * @desc Send verification code (DEV MODE: always sends 123456)
 * @access Public
 */
router.post('/verify-code', async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid phone number');
    }

    // DEV MODE: Just log and return success
    // In production, this would integrate with SMS service
    logger.info({ message: 'Verification code sent (DEV: 123456)', phone });

    res.status(200).json({
      success: true,
      data: {
        message: 'Verification code sent',
        // In dev mode, hint the code
        devCode: '123456',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/me
 * @desc Get current user info
 * @access Private
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        authType: true,
        phone: true,
        nickname: true,
        avatarUrl: true,
        weight: true,
        gender: true,
        workStart: true,
        workEnd: true,
        dailyGoal: true,
        timezone: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'NOT_FOUND', 'User not found');
    }

    res.status(200).json({
      success: true,
      data: user,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRouter };
