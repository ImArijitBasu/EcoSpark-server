import { Router } from 'express';
import { categoryController } from './category.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createCategorySchema, updateCategorySchema } from './category.schema';

const router = Router();

// Public
router.get('/', categoryController.getAll);

// Admin only
router.post('/', authenticate, authorize('ADMIN'), validate(createCategorySchema), categoryController.create);
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updateCategorySchema), categoryController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), categoryController.delete);

export default router;
