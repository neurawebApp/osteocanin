// backend/src/routes/appointments.ts (Updated with cancel functionality)
import { Router } from 'express';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { AppointmentService } from '../services/appointmentService';
import { UserRole, AppointmentStatus } from '@prisma/client';
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
      await fetch(`${process.env.API_URL}/api/reminders/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || ''
        },
        body: JSON.stringify({ appointmentId: appointment.id })
      });
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