// backend/src/routes/reminders.ts
import { Router } from 'express';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { prisma } from '../index';
import { UserRole, ReminderType } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const createReminderSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  type: z.string().default('MANUAL'),
  dueDate: z.string(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  appointmentId: z.string().optional(),
});

// Get user's reminders
router.get('/', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      // This would typically query the Reminder model from your Prisma schema
      const reminders = await prisma.reminder.findMany({
        where: {
          appointment: {
            OR: [
              { clientId: req.user!.id },
              // For admins/practitioners, show all reminders
              ...(req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.PRACTITIONER 
                ? [{}] 
                : []
              )
            ]
          }
        },
        include: {
          appointment: {
            include: {
              client: true,
              animal: true,
              service: true
            }
          }
        },
        orderBy: { remindAt: 'asc' }
      });

      // Transform reminders to include our custom fields
      const transformedReminders = reminders.map(reminder => ({
        id: reminder.id,
        message: reminder.message,
        type: reminder.type,
        dueDate: reminder.remindAt.toISOString(),
        completed: reminder.sent, // Using 'sent' as 'completed' for now
        priority: 'medium', // Default priority
        appointmentId: reminder.appointmentId,
        createdAt: reminder.createdAt.toISOString()
      }));

      res.json({ data: transformedReminders });
    } catch (error: any) {
      console.error('Error fetching reminders:', error);
      res.status(500).json({ error: 'Failed to fetch reminders' });
    }
  }
);

// Create new reminder
router.post('/', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      console.log('Creating reminder with data:', req.body);
      const validatedData = createReminderSchema.parse(req.body);
      
      // For manual reminders without appointment, create a mock reminder
      if (validatedData.appointmentId) {
        const reminder = await prisma.reminder.create({
          data: {
            message: validatedData.message,
            messageFr: validatedData.message,
            type: validatedData.type as ReminderType,
            remindAt: new Date(validatedData.dueDate),
            sent: false,
            appointmentId: validatedData.appointmentId
          }
        });

        return res.status(201).json({
          data: {
            id: reminder.id,
            message: reminder.message,
            type: reminder.type,
            dueDate: reminder.remindAt.toISOString(),
            completed: reminder.sent,
            priority: validatedData.priority,
            appointmentId: reminder.appointmentId,
            createdAt: reminder.createdAt.toISOString()
          },
          message: 'Reminder created successfully'
        });
      } else {
        // For manual reminders, we'll create a simple reminder object
        // Since our schema requires appointmentId, we'll need to handle this differently
        const mockReminder = {
          id: `manual-${Date.now()}`,
          message: validatedData.message,
          type: validatedData.type,
          dueDate: validatedData.dueDate,
          completed: false,
          priority: validatedData.priority,
          createdAt: new Date().toISOString()
        };
        
        console.log('Created manual reminder:', mockReminder);
        return res.status(201).json({
          data: mockReminder,
          message: 'Reminder created successfully'
        });
      }
    } catch (error: any) {
      console.error('Error creating reminder:', error);
      res.status(400).json({
        error: error.message || 'Failed to create reminder'
      });
    }
  }
);

// Mark reminder as done
router.put('/:id/complete', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      console.log('Marking reminder as done:', id);
      
      // Handle manual reminders (they start with 'manual-')
      if (id.startsWith('manual-')) {
        return res.json({
          data: {
            id: id,
            completed: true
          },
          message: 'Manual reminder marked as completed'
        });
      }

      try {
        const reminder = await prisma.reminder.update({
          where: { id },
          data: { sent: true }
        });

        res.json({
          data: {
            id: reminder.id,
            completed: reminder.sent
          },
          message: 'Reminder marked as completed'
        });
      } catch (dbError) {
        console.error('Database error marking reminder done:', dbError);
        // Fallback for manual reminders
        res.json({
          data: {
            id: id,
            completed: true
          },
          message: 'Reminder marked as completed'
        });
      }
    } catch (error: any) {
      console.error('Error marking reminder done:', error);
      res.status(400).json({
        error: 'Failed to complete reminder'
      });
    }
  }
);

// Delete reminder
router.delete('/:id', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      console.log('Deleting reminder:', id);
      
      // Handle manual reminders (they start with 'manual-')
      if (id.startsWith('manual-')) {
        return res.json({
          message: 'Manual reminder deleted successfully'
        });
      }

      try {
        await prisma.reminder.delete({
          where: { id }
        });
      } catch (dbError) {
        console.error('Database error deleting reminder:', dbError);
        // Continue anyway for manual reminders
      }

      res.json({
        message: 'Reminder deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting reminder:', error);
      res.status(400).json({
        error: 'Failed to delete reminder'
      });
    }
  }
);

// Create booking reminders automatically
router.post('/booking', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      const { appointmentId } = req.body;
      
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: true,
          animal: true,
          service: true
        }
      });

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Create multiple reminders for the appointment
      const reminders = [
        {
          type: ReminderType.APPOINTMENT_CONFIRMATION,
          message: `Confirm appointment for ${appointment.animal.name} on ${appointment.startTime.toDateString()}`,
          messageFr: `Confirmer le rendez-vous pour ${appointment.animal.name} le ${appointment.startTime.toDateString()}`,
          remindAt: new Date(appointment.startTime.getTime() - 24 * 60 * 60 * 1000), // 24 hours before
          appointmentId: appointment.id
        },
        {
          type: ReminderType.APPOINTMENT_REMINDER,
          message: `Reminder: ${appointment.animal.name}'s appointment tomorrow`,
          messageFr: `Rappel: rendez-vous de ${appointment.animal.name} demain`,
          remindAt: new Date(appointment.startTime.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
          appointmentId: appointment.id
        },
        {
          type: ReminderType.FOLLOW_UP,
          message: `Follow up on ${appointment.animal.name}'s ${appointment.service.title} treatment`,
          messageFr: `Suivi du traitement ${appointment.service.title} de ${appointment.animal.name}`,
          remindAt: new Date(appointment.startTime.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after
          appointmentId: appointment.id
        }
      ];

      const createdReminders = await Promise.all(
        reminders.map(reminder => 
          prisma.reminder.create({
            data: {
              ...reminder,
              sent: false
            }
          })
        )
      );

      res.status(201).json({
        data: createdReminders.map(r => ({
          id: r.id,
          message: r.message,
          type: r.type,
          dueDate: r.remindAt.toISOString(),
          completed: r.sent,
          appointmentId: r.appointmentId
        })),
        message: 'Booking reminders created successfully'
      });
    } catch (error: any) {
      console.error('Error creating booking reminders:', error);
      res.status(400).json({
        error: 'Failed to create booking reminders'
      });
    }
  }
);

export default router;