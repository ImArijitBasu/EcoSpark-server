import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema, refreshSchema, updateProfileSchema } from './auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refreshToken);
router.get('/me', authenticate, authController.getProfile);
router.patch('/me', authenticate, validate(updateProfileSchema), authController.updateProfile);

export default router;
