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
      console.log('Validating client:', id);
      
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

      if (user.role !== UserRole.CLIENT) {
        return res.status(400).json({ error: 'Only client accounts can be validated' });
      }

      console.log('Client validated successfully:', user.email);
      res.json({
        data: user,
        message: 'Client account validated successfully'
      });
    } catch (error: any) {
      console.error('Error validating client:', error);
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
      console.log('Deleting client:', id);
      
      const user = await prisma.user.findUnique({
        where: { id },
        select: { role: true, email: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.role !== UserRole.CLIENT) {
        return res.status(400).json({ error: 'Only client accounts can be deleted' });
      }

      // Delete the user (cascade will handle related records)
      await prisma.user.delete({
        where: { id }
      });

      console.log('Client deleted successfully:', user.email);
      res.json({
        message: 'Client account deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting client:', error);
      res.status(400).json({
        error: 'Failed to delete client account'
      });
    }
  }
);

export default router;