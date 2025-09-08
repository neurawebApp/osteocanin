// backend/src/routes/dashboard.ts
import { Router } from 'express';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { prisma } from '../index';
import { UserRole } from '@prisma/client';

const router = Router();

// Admin dashboard metrics
router.get('/metrics', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      const [
        totalClients,
        totalAnimals,
        totalAppointments,
        upcomingAppointments,
        monthlyRevenue,
        contactSubmissions
      ] = await Promise.all([
        prisma.user.count({ where: { role: UserRole.CLIENT } }),
        prisma.animal.count(),
        prisma.appointment.count(),
        prisma.appointment.count({
          where: {
            startTime: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
            }
          }
        }),
        prisma.appointment.aggregate({
          where: {
            startTime: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            },
            status: 'COMPLETED'
          },
          _sum: {
            service: {
              price: true
            }
          }
        }),
        prisma.contactSubmission.count({
          where: { responded: false }
        })
      ]);

      res.json({
        data: {
          totalClients,
          totalAnimals,
          totalAppointments,
          upcomingAppointments,
          monthlyRevenue: monthlyRevenue._sum || 0,
          pendingContacts: contactSubmissions
        }
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to fetch dashboard metrics'
      });
    }
  }
);

// Today's schedule
router.get('/schedule', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointments = await prisma.appointment.findMany({
        where: {
          startTime: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          client: {
            select: { firstName: true, lastName: true, email: true, phone: true }
          },
          animal: true,
          service: true
        },
        orderBy: { startTime: 'asc' }
      });

      res.json({
        data: appointments
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to fetch today\'s schedule'
      });
    }
  }
);

export default router;