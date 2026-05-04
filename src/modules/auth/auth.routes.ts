import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { upload } from '../../middleware/upload';
import { registerSchema, loginSchema, refreshSchema, updateProfileSchema } from './auth.schema';

const router = Router();

router.get('/me', authenticate, authController.getProfile);
router.patch('/profile', authenticate, upload.single('avatar'), authController.updateProfile);
router.patch('/change-password', authenticate, authController.changePassword);

export default router;
