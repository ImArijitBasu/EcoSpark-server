import { Router } from 'express';
import { commentController } from './comment.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';

const router = Router({ mergeParams: true });

// Get comments for an idea (public)
router.get('/:ideaId/comments', commentController.getComments);

// Create comment (authenticated)
router.post('/:ideaId/comments', authenticate, commentController.createComment);

// Delete comment (admin only)
router.delete('/comments/:commentId', authenticate, authorize('ADMIN'), commentController.deleteComment);

export default router;
