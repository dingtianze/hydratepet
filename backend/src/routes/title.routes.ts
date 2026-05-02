import { Router } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/titles
 * @desc Get all titles for user
 * @access Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // Get user's unlocked titles
    const userTitles = await prisma.userTitle.findMany({
      where: { userId },
      include: { titleDef: true },
    });

    // Get all title definitions
    const allTitles = await prisma.titleDef.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const unlockedIds = new Set(userTitles.map(ut => ut.titleId));

    // Build response
    const current = userTitles.find(ut => ut.isActive)?.titleDef || null;
    
    const unlocked = userTitles.map(ut => ({
      id: ut.titleDef.id,
      key: ut.titleDef.key,
      name: ut.titleDef.name,
      icon: ut.titleDef.icon,
      description: ut.titleDef.description,
      category: ut.titleDef.category,
      unlockedAt: ut.unlockedAt,
      isActive: ut.isActive,
    }));

    const locked = allTitles
      .filter(t => !unlockedIds.has(t.id))
      .map(t => ({
        id: t.id,
        key: t.key,
        name: t.name,
        icon: t.icon,
        description: t.description,
        category: t.category,
      }));

    res.status(200).json({
      success: true,
      data: {
        current: current ? {
          id: current.id,
          key: current.key,
          name: current.name,
          icon: current.icon,
          description: current.description,
          category: current.category,
        } : null,
        unlocked,
        locked,
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
 * @route POST /api/titles/:id/equip
 * @desc Equip a title
 * @access Private
 */
router.post('/:id/equip', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user has this title
    const userTitle = await prisma.userTitle.findFirst({
      where: {
        userId,
        titleId: id,
      },
    });

    if (!userTitle) {
      throw new ApiError(404, 'NOT_FOUND', 'Title not unlocked');
    }

    // Use transaction to unequip current and equip new
    await prisma.$transaction(async (tx) => {
      // Unequip all titles
      await tx.userTitle.updateMany({
        where: { userId },
        data: { isActive: false },
      });

      // Equip selected title
      await tx.userTitle.update({
        where: { id: userTitle.id },
        data: { isActive: true },
      });
    });

    res.status(200).json({
      success: true,
      data: { message: 'Title equipped successfully' },
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
 * @route GET /api/badges
 * @desc Get all badges for user
 * @access Private
 */
router.get('/badges', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // Get user's unlocked badges
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badgeDef: true },
    });

    // Get all badge definitions
    const allBadges = await prisma.badgeDef.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const unlockedIds = new Set(userBadges.map(ub => ub.badgeId));

    const unlocked = userBadges.map(ub => ({
      id: ub.badgeDef.id,
      key: ub.badgeDef.key,
      name: ub.badgeDef.name,
      iconUrl: ub.badgeDef.iconUrl,
      description: ub.badgeDef.description,
      rarity: ub.badgeDef.rarity,
      unlockedAt: ub.unlockedAt,
    }));

    const locked = allBadges
      .filter(b => !unlockedIds.has(b.id))
      .map(b => ({
        id: b.id,
        key: b.key,
        name: b.name,
        iconUrl: b.iconUrl,
        description: b.description,
        rarity: b.rarity,
      }));

    res.status(200).json({
      success: true,
      data: {
        unlocked,
        locked,
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

export { router as titleRouter };
