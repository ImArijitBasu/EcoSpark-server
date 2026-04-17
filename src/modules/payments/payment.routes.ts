import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All payment routes require authentication
router.post('/create-checkout-session', authenticate, paymentController.createCheckoutSession);
router.get('/verify/:sessionId', authenticate, paymentController.verifyPayment);
router.get('/check/:ideaId', authenticate, paymentController.checkPaymentStatus);

export default router;
