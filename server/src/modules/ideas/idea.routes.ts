import { Router } from 'express';
import { ideaController } from './idea.controller';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { updateIdeaStatusSchema } from './idea.schema';
import { upload } from '../../middleware/upload';

const router = Router();

// Public routes (static paths MUST come before /:id)
router.get('/', ideaController.getApprovedIdeas);
router.get('/featured', ideaController.getFeaturedIdeas);

// Authenticated member routes (static paths before /:id)
router.get('/user/my', authenticate, ideaController.getMyIdeas);
router.post('/', authenticate, upload.array('images', 5), ideaController.createIdea);

// Admin routes (static paths before /:id)
router.get('/admin/all', authenticate, authorize('ADMIN'), ideaController.getAllIdeas);

// Dynamic :id routes LAST
router.get('/:id', optionalAuth, ideaController.getIdeaById);
router.patch('/:id', authenticate, upload.array('images', 5), ideaController.updateIdea);
router.delete('/:id', authenticate, ideaController.deleteIdea);
router.patch('/:id/submit', authenticate, ideaController.submitForReview);
router.patch('/:id/status', authenticate, authorize('ADMIN'), validate(updateIdeaStatusSchema), ideaController.updateStatus);

export default router;
