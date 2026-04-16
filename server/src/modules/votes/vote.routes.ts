import { Router } from 'express';
import { voteController } from './vote.controller';
import { authenticate } from '../../middleware/auth';

const router = Router({ mergeParams: true });

// All vote routes require authentication
router.post('/:ideaId/votes', authenticate, voteController.toggleVote);
router.delete('/:ideaId/votes', authenticate, voteController.removeVote);
router.get('/:ideaId/votes/me', authenticate, voteController.getUserVote);

export default router;
