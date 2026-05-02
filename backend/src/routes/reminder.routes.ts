import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { authenticate } from '../middleware/auth';

const router = Router();

// Validation schemas
const configSchema = z.object({
  enabled: z.boolean().optional(),
  intervals: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)).optional(),
  workdaysOnly: z.boolean().optional(),
  quietHours: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  }).optional(),
  soundEnabled: z.boolean().optional(),
  vibrationEnabled: z.boolean().optional(),
});

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

/**
 * @route GET /api/reminders/config
 * @desc Get reminder config
 * @access Private
 */
router.get('/config', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    let config = await prisma.reminderConfig.findUnique({
      where: { userId },
    });

    // Create default config if not exists
    if (!config) {
      config = await prisma.reminderConfig.create({
        data: {
          userId,
          enabled: true,
          intervals: JSON.stringify(['09:30', '11:00', '14:00', '16:00', '17:00']),
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        enabled: config.enabled,
        intervals: config.intervals,
        workdaysOnly: config.workdaysOnly,
        quietHours: {
          start: config.quietHoursStart,
          end: config.quietHoursEnd,
        },
        soundEnabled: config.soundEnabled,
        vibrationEnabled: config.vibrationEnabled,
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
 * @route PUT /api/reminders/config
 * @desc Update reminder config
 * @access Private
 */
router.put('/config', authenticate, async (req, res, next) => {
  try {
    const data = configSchema.parse(req.body);
    const userId = req.user!.id;

    const updateData: any = {};
    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    if (data.intervals) updateData.intervals = JSON.stringify(data.intervals);
    if (data.workdaysOnly !== undefined) updateData.workdaysOnly = data.workdaysOnly;
    if (data.soundEnabled !== undefined) updateData.soundEnabled = data.soundEnabled;
    if (data.vibrationEnabled !== undefined) updateData.vibrationEnabled = data.vibrationEnabled;
    if (data.quietHours) {
      updateData.quietHoursStart = data.quietHours.start;
      updateData.quietHoursEnd = data.quietHours.end;
    }

    const config = await prisma.reminderConfig.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        enabled: data.enabled ?? true,
        intervals: data.intervals ? JSON.stringify(data.intervals) : JSON.stringify(['09:30', '11:00', '14:00', '16:00', '17:00']),
        workdaysOnly: data.workdaysOnly ?? false,
        soundEnabled: data.soundEnabled ?? true,
        vibrationEnabled: data.vibrationEnabled ?? true,
        quietHoursStart: data.quietHours?.start ?? '22:00',
        quietHoursEnd: data.quietHours?.end ?? '08:00',
      },
    });

    res.status(200).json({
      success: true,
      data: {
        enabled: config.enabled,
        intervals: config.intervals,
        workdaysOnly: config.workdaysOnly,
        quietHours: {
          start: config.quietHoursStart,
          end: config.quietHoursEnd,
        },
        soundEnabled: config.soundEnabled,
        vibrationEnabled: config.vibrationEnabled,
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
 * @route POST /api/reminders/subscribe
 * @desc Subscribe to push notifications
 * @access Private
 */
router.post('/subscribe', authenticate, async (req, res, next) => {
  try {
    const data = subscribeSchema.parse(req.body);
    const userId = req.user!.id;

    // Store push subscription
    await prisma.user.update({
      where: { id: userId },
      data: {
        pushToken: JSON.stringify(data),
      },
    });

    res.status(200).json({
      success: true,
      data: { message: 'Subscribed to push notifications' },
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
 * @route POST /api/reminders/unsubscribe
 * @desc Unsubscribe from push notifications
 * @access Private
 */
router.post('/unsubscribe', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        pushToken: null,
      },
    });

    res.status(200).json({
      success: true,
      data: { message: 'Unsubscribed from push notifications' },
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
 * @route POST /api/reminders/test
 * @desc Send test push notification
 * @access Private
 */
router.post('/test', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // Get user's push token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true, nickname: true },
    });

    if (!user?.pushToken) {
      throw new ApiError(400, 'BAD_REQUEST', 'No push subscription found');
    }

    // TODO: Implement actual push notification using web-push
    // const subscription = JSON.parse(user.pushToken);
    // await webPush.sendNotification(subscription, payload);

    res.status(200).json({
      success: true,
      data: { message: 'Test push notification sent' },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as reminderRouter };
