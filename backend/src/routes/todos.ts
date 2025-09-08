// backend/src/routes/todos.ts
import { Router } from 'express';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { prisma } from '../index';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const createTodoSchema = z.object({
  task: z.string().min(1, 'Task is required'),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  dueDate: z.string().optional(),
  description: z.string().optional(),
});

const updateTodoSchema = z.object({
  task: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  dueDate: z.string().optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
});

// Get user's todos
router.get('/', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      // For now, we'll store todos in a separate model or use a JSON field in user
      // This is a simplified version using a hypothetical Todo model
      const todos = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { 
          id: true,
          // Assuming we add a todos JSON field to the user model
          // or create a separate Todo model
        }
      });

      // Mock data for now - replace with actual database queries
      const mockTodos = [
        {
          id: '1',
          task: 'Follow up with Mrs. Anderson about Luna\'s progress',
          completed: false,
          priority: 'high',
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          task: 'Update website with new service pricing',
          completed: false,
          priority: 'medium',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          task: 'Order new treatment table for clinic',
          completed: true,
          priority: 'low',
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          task: 'Schedule social media posts for next week',
          completed: false,
          priority: 'medium',
          createdAt: new Date().toISOString()
        },
        {
          id: '5',
          task: 'Review and respond to Google reviews',
          completed: false,
          priority: 'high',
          createdAt: new Date().toISOString()
        }
      ];

      res.json({ data: mockTodos });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch todos' });
    }
  }
);

// Create new todo
router.post('/', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      const validatedData = createTodoSchema.parse(req.body);
      
      // Mock creation - replace with actual database logic
      const newTodo = {
        id: Date.now().toString(),
        ...validatedData,
        completed: false,
        createdAt: new Date().toISOString(),
        userId: req.user!.id
      };

      res.status(201).json({
        data: newTodo,
        message: 'Todo created successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to create todo'
      });
    }
  }
);

// Update todo
router.put('/:id', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateTodoSchema.parse(req.body);
      
      // Mock update - replace with actual database logic
      const updatedTodo = {
        id,
        ...validatedData,
        updatedAt: new Date().toISOString()
      };

      res.json({
        data: updatedTodo,
        message: 'Todo updated successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to update todo'
      });
    }
  }
);

// Toggle todo completion
router.put('/:id/toggle', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      // Mock toggle - replace with actual database logic
      const toggledTodo = {
        id,
        completed: true, // This should be the opposite of current state
        updatedAt: new Date().toISOString()
      };

      res.json({
        data: toggledTodo,
        message: 'Todo toggled successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'Failed to toggle todo'
      });
    }
  }
);

// Delete todo
router.delete('/:id', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      // Mock deletion - replace with actual database logic
      res.json({
        message: 'Todo deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'Failed to delete todo'
      });
    }
  }
);

export default router;