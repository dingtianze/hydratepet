import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { authenticate } from '../middleware/auth';
import { 
  getPetStatus, 
  initializePet,
  EVOLUTION_THRESHOLDS,
  STAGE_NAMES,
  MOOD_STATES,
  getMaxGrowthForStage,
  getPetStage,
} from '../services/petGrowth';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const renameSchema = z.object({
  name: z.string().min(1).max(50),
});

const initializeSchema = z.object({
  name: z.string().min(1).max(50).optional(),
});

/**
 * @route GET /api/pets
 * @desc Get user's pet status
 * @access Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const petStatus = await getPetStatus(req.user!.id);

    res.status(200).json({
      success: true,
      data: petStatus,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Pet not found') {
      next(new ApiError(404, 'NOT_FOUND', 'Pet not found'));
    } else {
      next(error);
    }
  }
});

/**
 * @route POST /api/pets/rename
 * @desc Rename pet
 * @access Private
 */
router.post('/rename', authenticate, async (req, res, next) => {
  try {
    const data = renameSchema.parse(req.body);

    const pet = await prisma.pet.update({
      where: { userId: req.user!.id },
      data: { name: data.name },
    });

    res.status(200).json({
      success: true,
      data: {
        id: pet.id,
        name: pet.name,
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
 * @route POST /api/pets/interact
 * @desc Interact with pet
 * @access Private
 */
router.post('/interact', authenticate, async (req, res, next) => {
  try {
    const pet = await prisma.pet.findUnique({
      where: { userId: req.user!.id },
    });

    if (!pet) {
      throw new ApiError(404, 'NOT_FOUND', 'Pet not found');
    }

    // Update mood to happy when interacted
    const updatedPet = await prisma.pet.update({
      where: { userId: req.user!.id },
      data: { mood: 'happy' },
    });

    res.status(200).json({
      success: true,
      data: {
        message: `${pet.name} 很开心！`,
        mood: updatedPet.mood,
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
 * @route POST /api/pets/initialize
 * @desc Initialize pet for new user
 * @access Private
 */
router.post('/initialize', authenticate, async (req, res, next) => {
  try {
    const data = initializeSchema.parse(req.body);

    // Check if pet already exists
    const existingPet = await prisma.pet.findUnique({
      where: { userId: req.user!.id },
    });

    if (existingPet) {
      throw new ApiError(409, 'CONFLICT', 'Pet already exists');
    }

    const pet = await initializePet(req.user!.id, data.name);

    logger.info({
      message: 'Pet initialized via API',
      userId: req.user!.id,
      petId: pet.id,
    });

    res.status(201).json({
      success: true,
      data: {
        id: pet.id,
        name: pet.name,
        stage: pet.stage,
        growth: pet.growth,
        mood: pet.mood,
        health: pet.health,
        message: `恭喜！${pet.name}已经加入你的家庭！`,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Pet already exists for this user') {
      next(new ApiError(409, 'CONFLICT', 'Pet already exists'));
    } else {
      next(error);
    }
  }
});

/**
 * @route GET /api/pets/progress
 * @desc Get pet growth progress
 * @access Private
 */
router.get('/progress', authenticate, async (req, res, next) => {
  try {
    const { getPetProgress } = await import('../services/stats');
    const progress = await getPetProgress(req.user!.id);

    res.status(200).json({
      success: true,
      data: progress,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Pet not found') {
      next(new ApiError(404, 'NOT_FOUND', 'Pet not found'));
    } else {
      next(error);
    }
  }
});

/**
 * @route GET /api/pets/evolution-info
 * @desc Get evolution thresholds info
 * @access Private
 */
router.get('/evolution-info', authenticate, async (_req, res, next) => {
  try {
    const evolutionInfo = {
      stages: [
        { stage: 'egg', name: STAGE_NAMES.egg, minGrowth: EVOLUTION_THRESHOLDS.egg },
        { stage: 'baby', name: STAGE_NAMES.baby, minGrowth: EVOLUTION_THRESHOLDS.baby },
        { stage: 'child', name: STAGE_NAMES.child, minGrowth: EVOLUTION_THRESHOLDS.child },
        { stage: 'teen', name: STAGE_NAMES.teen, minGrowth: EVOLUTION_THRESHOLDS.teen },
        { stage: 'adult', name: STAGE_NAMES.adult, minGrowth: EVOLUTION_THRESHOLDS.adult },
      ],
      moods: Object.values(MOOD_STATES),
    };

    res.status(200).json({
      success: true,
      data: evolutionInfo,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as petRouter };
export { getPetStage, EVOLUTION_THRESHOLDS };
