import { Router } from 'express';
import { BlogController } from '../controllers/blogController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.get('/', BlogController.getAllPosts);
router.get('/:slug', BlogController.getPostBySlug);

// Protected routes
router.post('/', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  BlogController.createPost
);

router.put('/:id', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  BlogController.updatePost
);

router.delete('/:id', 
  authenticateToken, 
  requireRole([UserRole.ADMIN, UserRole.PRACTITIONER]), 
  BlogController.deletePost
);

export default router;