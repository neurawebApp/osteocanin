// backend/src/routes/animals.ts
import { Router } from 'express';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { prisma } from '../index';
import { UserRole, AnimalGender } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const createAnimalSchema = z.object({
  name: z.string().min(1),
  breed: z.string().min(1),
  age: z.number().min(0),
  weight: z.number().min(0).optional(),
  gender: z.nativeEnum(AnimalGender),
  notes: z.string().optional(),
});

// Get user's animals
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const animals = await prisma.animal.findMany({
      where: { ownerId: req.user!.id },
      include: {
        appointments: {
          include: {
            service: true
          },
          orderBy: { startTime: 'desc' }
        },
        treatmentNotes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({
      data: animals
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch animals'
    });
  }
});

// Create new animal
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const validatedData = createAnimalSchema.parse(req.body);
    
    const animal = await prisma.animal.create({
      data: {
        ...validatedData,
        ownerId: req.user!.id
      }
    });

    res.status(201).json({
      data: animal,
      message: 'Animal created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Failed to create animal'
    });
  }
});

export default router;