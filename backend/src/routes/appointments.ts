// backend/src/routes/appointments.ts (Updated with cancel functionality)
import { Router } from 'express';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { AppointmentService } from '../services/appointmentService';
import { UserRole, AppointmentStatus, ReminderType } from '@prisma/client';
import { prisma } from '../index';
import { z } from 'zod';

const router = Router();

const createAppointmentSchema = z.object({
  serviceId: z.string(),
  animalId: z.string(),
  startTime: z.string().transform(str => new Date(str)),
  notes: z.string().optional(),
});

// Get user's appointments
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const appointments = await AppointmentService.getAppointmentsByUser(req.user!.id);
    
    res.json({
      data: appointments
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch appointments'
    });
  }
});

// Create appointment
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const validatedData = createAppointmentSchema.parse(req.body);
    
    // Calculate end time based on service duration
    const service = await prisma.service.findUnique({
      where: { id: validatedData.serviceId }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const endTime = new Date(validatedData.startTime);
    endTime.setMinutes(endTime.getMinutes() + service.duration);

    // Check availability
    const isAvailable = await AppointmentService.checkAvailability(
      validatedData.serviceId,
      validatedData.startTime,
      endTime
    );

    if (!isAvailable) {
      return res.status(409).json({
        error: 'Time slot is not available'
      });
    }

    const appointment = await AppointmentService.createAppointment({
      startTime: validatedData.startTime,
      endTime,
      notes: validatedData.notes,
      client: {
        connect: { id: req.user!.id }
      },
      animal: {
        connect: { id: validatedData.animalId }
      },
      service: {
        connect: { id: validatedData.serviceId }
      }
    });

    // Automatically create reminders for new appointments
    try {
      // Create automatic reminders
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
        }
      ];

      await Promise.all(
        reminders.map(reminder => 
          prisma.reminder.create({
            data: {
              ...reminder,
              sent: false
            }
          })
        )
      );
    } catch (reminderError) {
      console.error('Failed to create automatic reminders:', reminderError);
      // Don't fail the appointment creation if reminders fail
    }

    res.status(201).json({
      data: appointment,
      message: 'Appointment created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Failed to create appointment'
    });
  }
});

// Cancel appointment
router.put('/:id/cancel', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        animal: true,
        service: true
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if user can cancel this appointment
    if (appointment.clientId !== req.user!.id && 
        req.user!.role !== UserRole.ADMIN && 
        req.user!.role !== UserRole.PRACTITIONER) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }

    // Don't allow cancelling appointments that are too close or already completed
    const now = new Date();
    const appointmentTime = new Date(appointment.startTime);
    const hoursDifference = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < 2 && req.user!.role === UserRole.CLIENT) {
      return res.status(400).json({ 
        error: 'Cannot cancel appointments less than 2 hours before the scheduled time' 
      });
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      return res.status(400).json({ 
        error: 'Cannot cancel completed appointments' 
      });
    }

    // Update appointment status
    const cancelledAppointment = await prisma.appointment.update({
      where: { id },
      data: { 
        status: AppointmentStatus.CANCELLED,
        updatedAt: new Date()
      },
      include: {
        client: true,
        animal: true,
        service: true
      }
    });

    // Cancel related reminders
    await prisma.reminder.updateMany({
      where: { 
        appointmentId: id,
        sent: false
      },
      data: { sent: true } // Mark as sent to effectively cancel them
    });

    // Create a new reminder/todo for follow-up
    const followUpMessage = `Follow up on cancelled appointment: ${appointment.client.firstName} ${appointment.client.lastName} - ${appointment.animal.name} (${appointment.service.title})`;
    
    await prisma.reminder.create({
      data: {
        type: ReminderType.FOLLOW_UP,
        message: followUpMessage,
        messageFr: followUpMessage, // You'd translate this
        remindAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        appointmentId: id,
        sent: false
      }
    });

    res.json({
      data: cancelledAppointment,
      message: 'Appointment cancelled successfully'
    });
  } catch (error: any) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      error: 'Failed to cancel appointment'
    });
  }
});

// Update appointment status
router.put('/:id/status', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(AppointmentStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const appointment = await prisma.appointment.update({
        where: { id },
        data: { status },
        include: {
          client: true,
          animal: true,
          service: true
        }
      });

      res.json({
        data: appointment,
        message: 'Appointment status updated successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'Failed to update appointment status'
      });
    }
  }
);

// Confirm appointment (admin only)
router.put('/:id/confirm', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const appointment = await prisma.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.CONFIRMED },
        include: {
          client: true,
          animal: true,
          service: true
        }
      });

      res.json({
        data: appointment,
        message: 'Appointment confirmed successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'Failed to confirm appointment'
      });
    }
  }
);

// Refuse appointment (admin only)
router.put('/:id/refuse', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const appointment = await prisma.appointment.update({
        where: { id },
        data: { 
          status: AppointmentStatus.CANCELLED,
          notes: reason ? `${appointment.notes || ''}\n\nRefused by admin: ${reason}` : appointment.notes
        },
        include: {
          client: true,
          animal: true,
          service: true
        }
      });

      res.json({
        data: appointment,
        message: 'Appointment refused successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'Failed to refuse appointment'
      });
    }
  }
);

// Check availability
router.get('/availability', async (req, res) => {
  try {
    const { serviceId, date } = req.query;
    
    if (!serviceId || !date) {
      return res.status(400).json({
        error: 'Service ID and date are required'
      });
    }

    const slots = await AppointmentService.getAvailableSlots(
      serviceId as string,
      new Date(date as string)
    );

    res.json({
      data: slots
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Failed to check availability'
    });
  }
});

export default router;