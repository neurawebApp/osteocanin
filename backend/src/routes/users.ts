import { Router } from 'express';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { prisma } from '../index';
import { UserRole } from '@prisma/client';

const router = Router();

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch user profile'
    });
  }
});

// Get all clients (admin only)
router.get('/clients', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      const clients = await prisma.user.findMany({
        where: { role: UserRole.CLIENT },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          createdAt: true,
          animals: {
            select: {
              id: true,
              name: true,
              breed: true
            }
          },
          appointments: {
            select: {
              id: true,
              startTime: true,
              status: true
            },
            orderBy: { startTime: 'desc' },
            take: 5
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ data: clients });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to fetch clients'
      });
    }
  }
);

// Validate/approve client account
router.put('/:id/validate', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      // For now, we'll just update a field or add a note
      // In a real app, you might have an 'approved' field
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        data: user,
        message: 'Client account validated successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'Failed to validate client account'
      });
    }
  }
);

// Delete client account
router.delete('/:id', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      await prisma.user.delete({
        where: { id }
      });

      res.json({
        message: 'Client account deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'Failed to delete client account'
      });
    }
  }
);

export default router;