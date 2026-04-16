import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';

const router = Router();

// All routes require admin access
router.use(authenticate, authorize('ADMIN'));

router.get('/', userController.getAllUsers);
router.patch('/:id/role', userController.changeRole);
router.patch('/:id/status', userController.toggleStatus);

export default router;
