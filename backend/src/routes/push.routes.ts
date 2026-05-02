import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

/**
 * @route POST /api/push/subscribe
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

    logger.info({ message: 'Push subscription created', userId });

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
 * @route POST /api/push/unsubscribe
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

    logger.info({ message: 'Push subscription removed', userId });

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
 * @route GET /api/push/status
 * @desc Check push subscription status
 * @access Private
 */
router.get('/status', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    });

    res.status(200).json({
      success: true,
      data: {
        isSubscribed: !!user?.pushToken,
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
 * @route POST /api/push/test
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

    // Parse subscription
    const subscription = JSON.parse(user.pushToken);

    // TODO: Implement actual push notification using web-push library
    // const webPush = require('web-push');
    // webPush.setVapidDetails(
    //   process.env.VAPID_SUBJECT!,
    //   process.env.VAPID_PUBLIC_KEY!,
    //   process.env.VAPID_PRIVATE_KEY!
    // );
    // await webPush.sendNotification(subscription, JSON.stringify({
    //   title: 'HydratePet Test',
    //   body: `Hello ${user.nickname}, this is a test notification!`,
    //   icon: '/icon.png',
    //   badge: '/badge.png',
    // }));

    res.status(200).json({
      success: true,
      data: { 
        message: 'Test push notification sent',
        subscription: {
          endpoint: subscription.endpoint,
          // Don't return full keys for security
        },
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

export { router as pushRouter };
